from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Product, UserInventory, InventoryMovement, ProductCategory, StockLevel
from app.schemas import (
    ProductOut, UserInventoryOut, UserInventoryCreate, UserInventoryUpdate,
    InventoryMovementOut, UserInventorySummary, QuickAddInventoryItem,
    BulkAddInventoryItems, ProductCategoryEnum
)
from app.inventory_utils import (
    add_to_inventory, get_user_inventory_summary, get_products_by_category,
    get_low_stock_products, get_expiring_soon_products, search_products,
    consume_from_inventory, find_or_create_product
)
from app.inventory_config import get_categories_for_frontend, get_stock_levels_for_frontend
from typing import List, Optional
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

DEMO_USER_ID = "demo-user"

# ===============================
# ENDPOINTS DE PRODUCTOS
# ===============================

@router.get("/inventory/products/search", response_model=List[ProductOut], tags=["inventory"])
def search_products_endpoint(
    q: str = Query(..., min_length=1, description="Término de búsqueda"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Buscar productos por nombre"""
    products = search_products(db, q, limit)
    return products

@router.get("/inventory/products/categories", tags=["inventory"])
def get_product_categories():
    """Obtener todas las categorías de productos con su configuración"""
    return {
        "categories": get_categories_for_frontend(),
        "stock_levels": get_stock_levels_for_frontend()
    }

@router.get("/inventory/products/by-category/{category}", response_model=List[ProductOut], tags=["inventory"])
def get_products_by_category_endpoint(
    category: ProductCategoryEnum,
    db: Session = Depends(get_db)
):
    """Obtener todos los productos de una categoría específica"""
    products = db.query(Product).filter(Product.category == category).all()
    return products

# ===============================
# ENDPOINTS DE INVENTARIO DE USUARIO
# ===============================

@router.get("/inventory/user/{user_id}/summary", response_model=UserInventorySummary, tags=["inventory"])
def get_inventory_summary(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Obtener resumen del inventario del usuario"""
    summary = get_user_inventory_summary(db, user_id)
    return summary

@router.get("/inventory/user/{user_id}/items", response_model=List[UserInventoryOut], tags=["inventory"])
def get_user_inventory(
    user_id: str,
    category: Optional[ProductCategoryEnum] = None,
    stock_level: Optional[StockLevel] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Obtener inventario del usuario con filtros opcionales"""
    query = db.query(UserInventory).filter(UserInventory.user_id == user_id)
    
    if category:
        query = query.join(Product).filter(Product.category == category)
    
    if stock_level:
        query = query.filter(UserInventory.stock_level == stock_level)
    
    # Ordenar por fecha de actualización más reciente
    query = query.order_by(UserInventory.updated_at.desc())
    
    items = query.offset(offset).limit(limit).all()
    return items

@router.get("/inventory/user/{user_id}/low-stock", response_model=List[UserInventoryOut], tags=["inventory"])
def get_low_stock_items(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Obtener productos con stock bajo o agotado"""
    items = get_low_stock_products(db, user_id)
    return items

@router.get("/inventory/user/{user_id}/expiring-soon", response_model=List[UserInventoryOut], tags=["inventory"])
def get_expiring_soon_items(
    user_id: str,
    days: int = Query(3, ge=1, le=30, description="Días hasta vencimiento"),
    db: Session = Depends(get_db)
):
    """Obtener productos que vencen pronto"""
    items = get_expiring_soon_products(db, user_id, days)
    return items

@router.get("/inventory/user/{user_id}/by-category/{category}", response_model=List[UserInventoryOut], tags=["inventory"])
def get_inventory_by_category(
    user_id: str,
    category: ProductCategoryEnum,
    db: Session = Depends(get_db)
):
    """Obtener inventario del usuario por categoría"""
    items = get_products_by_category(db, user_id, category)
    return items

# ===============================
# ENDPOINTS PARA AGREGAR AL INVENTARIO
# ===============================

@router.post("/inventory/user/{user_id}/add-item", response_model=UserInventoryOut, tags=["inventory"])
def add_inventory_item(
    user_id: str,
    item: QuickAddInventoryItem,
    db: Session = Depends(get_db)
):
    """Agregar un producto al inventario del usuario"""
    try:
        inventory_item, movement = add_to_inventory(
            db=db,
            user_id=user_id,
            product_name=item.product_name,
            category=item.category,
            quantity=item.quantity,
            unit=item.unit,
            purchase_date=item.purchase_date,
            expiration_date=item.expiration_date,
            store_purchased=item.store_purchased
        )
        
        db.commit()
        db.refresh(inventory_item)
        
        logger.info(f"Producto agregado al inventario: {item.product_name} para usuario {user_id}")
        return inventory_item
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error agregando producto al inventario: {e}")
        raise HTTPException(status_code=500, detail=f"Error agregando producto: {str(e)}")

@router.post("/inventory/user/bulk-add", tags=["inventory"])
def bulk_add_inventory_items(
    bulk_data: BulkAddInventoryItems,
    db: Session = Depends(get_db)
):
    """Agregar múltiples productos al inventario"""
    try:
        results = []
        
        for item in bulk_data.items:
            inventory_item, movement = add_to_inventory(
                db=db,
                user_id=bulk_data.user_id,
                product_name=item.product_name,
                category=item.category,
                quantity=item.quantity,
                unit=item.unit,
                purchase_date=item.purchase_date,
                expiration_date=item.expiration_date,
                store_purchased=item.store_purchased
            )
            results.append({
                "product_name": item.product_name,
                "inventory_item_id": inventory_item.id,
                "movement_id": movement.id
            })
        
        db.commit()
        
        logger.info(f"Agregados {len(results)} productos al inventario para usuario {bulk_data.user_id}")
        return {
            "success": True,
            "items_added": len(results),
            "results": results
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error en bulk add: {e}")
        raise HTTPException(status_code=500, detail=f"Error agregando productos: {str(e)}")

# ===============================
# ENDPOINTS PARA ACTUALIZAR INVENTARIO
# ===============================

@router.put("/inventory/items/{item_id}", response_model=UserInventoryOut, tags=["inventory"])
def update_inventory_item(
    item_id: int,
    update_data: UserInventoryUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar un item del inventario"""
    inventory_item = db.get(UserInventory, item_id)
    if not inventory_item:
        raise HTTPException(status_code=404, detail="Item de inventario no encontrado")
    
    # Actualizar campos
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(inventory_item, field, value)
    
    db.commit()
    db.refresh(inventory_item)
    
    return inventory_item

@router.post("/inventory/items/{item_id}/consume", tags=["inventory"])
def consume_inventory_item(
    item_id: int,
    quantity: float = Query(..., gt=0),
    reason: Optional[str] = None,
    reference_id: Optional[str] = None,
    reference_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Consumir cantidad de un producto del inventario"""
    inventory_item = db.get(UserInventory, item_id)
    if not inventory_item:
        raise HTTPException(status_code=404, detail="Item de inventario no encontrado")
    
    movement = consume_from_inventory(
        db=db,
        user_id=inventory_item.user_id,
        product_id=inventory_item.product_id,
        quantity=quantity,
        reason=reason,
        reference_id=reference_id,
        reference_type=reference_type
    )
    
    if not movement:
        raise HTTPException(status_code=400, detail="No se pudo consumir el producto (cantidad insuficiente)")
    
    db.commit()
    
    return {
        "success": True,
        "movement_id": movement.id,
        "quantity_consumed": quantity,
        "remaining_quantity": inventory_item.current_quantity
    }

@router.delete("/inventory/items/{item_id}", tags=["inventory"])
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    """Eliminar un item del inventario"""
    inventory_item = db.get(UserInventory, item_id)
    if not inventory_item:
        raise HTTPException(status_code=404, detail="Item de inventario no encontrado")
    
    db.delete(inventory_item)
    db.commit()
    
    return {"success": True, "message": "Item eliminado del inventario"}

# ===============================
# ENDPOINTS DE HISTORIAL
# ===============================

@router.get("/inventory/user/{user_id}/movements", response_model=List[InventoryMovementOut], tags=["inventory"])
def get_inventory_movements(
    user_id: str,
    product_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Obtener historial de movimientos de inventario"""
    query = db.query(InventoryMovement).filter(InventoryMovement.user_id == user_id)
    
    if product_id:
        query = query.filter(InventoryMovement.product_id == product_id)
    
    movements = query.order_by(InventoryMovement.created_at.desc()).offset(offset).limit(limit).all()
    return movements

# ===============================
# ENDPOINTS PARA DEMO/TESTING
# ===============================

@router.get("/inventory/demo/summary", response_model=UserInventorySummary, tags=["inventory", "demo"])
def get_demo_inventory_summary(db: Session = Depends(get_db)):
    """Obtener resumen del inventario del usuario demo"""
    return get_user_inventory_summary(db, DEMO_USER_ID)

@router.get("/inventory/demo/items", response_model=List[UserInventoryOut], tags=["inventory", "demo"])
def get_demo_inventory(
    category: Optional[ProductCategoryEnum] = None,
    db: Session = Depends(get_db)
):
    """Obtener inventario del usuario demo"""
    query = db.query(UserInventory).filter(UserInventory.user_id == DEMO_USER_ID)
    
    if category:
        query = query.join(Product).filter(Product.category == category)
    
    items = query.order_by(UserInventory.updated_at.desc()).all()
    return items

@router.post("/inventory/demo/add-sample-data", tags=["inventory", "demo"])
def add_sample_inventory_data(db: Session = Depends(get_db)):
    """Agregar datos de muestra al inventario del usuario demo"""
    from app.models import ProductCategory, MovementType
    from datetime import datetime, timedelta
    
    sample_items = [
        {"name": "Arroz integral", "category": ProductCategory.ABARROTES, "quantity": 2.0, "unit": "kg"},
        {"name": "Leche entera", "category": ProductCategory.LACTEOS, "quantity": 1.0, "unit": "litros"},
        {"name": "Pollo entero", "category": ProductCategory.CARNES, "quantity": 1.5, "unit": "kg"},
        {"name": "Pan de molde", "category": ProductCategory.PANADERIA, "quantity": 1.0, "unit": "unidades"},
        {"name": "Tomates cherry", "category": ProductCategory.VERDURAS, "quantity": 0.5, "unit": "kg"},
        {"name": "Manzanas rojas", "category": ProductCategory.FRUTAS, "quantity": 1.0, "unit": "kg"},
        {"name": "Aceite de oliva", "category": ProductCategory.CONDIMENTOS, "quantity": 0.5, "unit": "litros"},
        {"name": "Queso mantecoso", "category": ProductCategory.LACTEOS, "quantity": 0.2, "unit": "kg"},
    ]
    
    try:
        results = []
        for item in sample_items:
            inventory_item, movement = add_to_inventory(
                db=db,
                user_id=DEMO_USER_ID,
                product_name=item["name"],
                category=item["category"],
                quantity=item["quantity"],
                unit=item["unit"],
                purchase_date=datetime.utcnow() - timedelta(days=1),
                store_purchased="Supermercado Demo"
            )
            results.append(item["name"])
        
        db.commit()
        
        return {
            "success": True,
            "items_added": len(results),
            "products": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error agregando datos de muestra: {str(e)}")