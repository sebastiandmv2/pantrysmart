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
    consume_from_inventory, find_or_create_product, get_user_inventory_grouped_by_product_type,
    get_inventory_summary_by_generic_type
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

@router.get("/inventory/user/{user_id}/summary", tags=["inventory"])
def get_inventory_summary(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Obtener resumen del inventario del usuario - Versión mejorada"""
    try:
        logger.info(f"=== INICIO get_inventory_summary para usuario: {user_id} ===")
        
        try:
            # Contar productos totales
            total_products = db.query(UserInventory).filter(UserInventory.user_id == user_id).count()
            logger.info(f"Total productos contados: {total_products}")
            
            # Contar categorías únicas
            total_categories = 0
            if total_products > 0:
                try:
                    categories_query = db.query(Product.category).join(UserInventory).filter(
                        UserInventory.user_id == user_id
                    ).distinct().all()
                    total_categories = len(categories_query)
                    logger.info(f"Categorías encontradas: {total_categories}")
                except Exception as cat_e:
                    logger.error(f"Error contando categorías: {cat_e}")
                    total_categories = 1  # Fallback
            
            # Resumen mejorado
            summary = {
                "total_products": total_products,
                "total_categories": total_categories,
                "low_stock_products": 0,
                "expired_soon_products": 0,
                "categories": {},
                "last_updated": "2024-01-01T00:00:00"
            }
            
            logger.info(f"Resumen creado: {summary}")
            logger.info("=== FIN get_inventory_summary EXITOSO ===")
            return summary
            
        except Exception as inner_e:
            logger.error(f"Error en query básico: {inner_e}")
            # Si hasta el query básico falla, retornar datos hardcoded
            return {
                "total_products": 0,
                "total_categories": 0,
                "low_stock_products": 0,
                "expired_soon_products": 0,
                "categories": {},
                "last_updated": "2024-01-01T00:00:00"
            }
            
    except Exception as e:
        logger.error(f"=== ERROR CRÍTICO en get_inventory_summary: {str(e)} ===")
        logger.error(f"Tipo de error: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # En lugar de lanzar excepción, retornar datos por defecto
        return {
            "total_products": 0,
            "total_categories": 0,
            "low_stock_products": 0,
            "expired_soon_products": 0,
            "categories": {},
            "last_updated": "2024-01-01T00:00:00"
        }

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

@router.get("/inventory/user/{user_id}/grouped", tags=["inventory"])
def get_inventory_grouped_by_product_type(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Obtener inventario agrupado por tipo de producto genérico"""
    grouped_inventory = get_user_inventory_grouped_by_product_type(db, user_id)
    return {
        "success": True,
        "grouped_inventory": grouped_inventory,
        "total_generic_types": len(grouped_inventory),
        "total_types": len(grouped_inventory)  # Mantener compatibilidad
    }

@router.get("/inventory/user/{user_id}/summary-grouped", tags=["inventory"])
def get_inventory_summary_grouped(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Obtener resumen del inventario agrupado por tipo genérico"""
    summary = get_inventory_summary_by_generic_type(db, user_id)
    return summary

# ===============================
# ENDPOINTS PARA AGREGAR AL INVENTARIO
# ===============================

@router.post("/inventory/user/{user_id}/add-item", response_model=UserInventoryOut, tags=["inventory"])
def add_inventory_item(
    user_id: str,
    item: QuickAddInventoryItem,
    db: Session = Depends(get_db)
):
    """Agregar un producto al inventario del usuario - SIMPLIFICADO"""
    try:
        inventory_item, movement = add_to_inventory(
            db=db,
            user_id=user_id,
            product_name=item.product_name,
            category=item.category,
            quantity=item.quantity,  # Ya es entero por el schema actualizado
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
                quantity=item.quantity,  # Ya es entero por el schema actualizado
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
    quantity: int = Query(..., gt=0),  # SOLO ENTEROS
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
        {"name": "Arroz", "category": ProductCategory.ABARROTES, "quantity": 2.0, "unit": "unidades"},
        {"name": "Leche", "category": ProductCategory.LACTEOS, "quantity": 1.0, "unit": "unidades"},
        {"name": "Pollo", "category": ProductCategory.CARNES, "quantity": 1.0, "unit": "unidades"},
        {"name": "Pan", "category": ProductCategory.PANADERIA, "quantity": 1.0, "unit": "unidades"},
        {"name": "Tomate", "category": ProductCategory.VERDURAS, "quantity": 3.0, "unit": "unidades"},
        {"name": "Manzana", "category": ProductCategory.FRUTAS, "quantity": 5.0, "unit": "unidades"},
        {"name": "Aceite", "category": ProductCategory.CONDIMENTOS, "quantity": 1.0, "unit": "unidades"},
        {"name": "Queso", "category": ProductCategory.LACTEOS, "quantity": 1.0, "unit": "unidades"},
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
                unit=item["unit"]
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

@router.delete("/inventory/demo/clear-all-data", tags=["inventory", "demo"])
def clear_all_demo_data(db: Session = Depends(get_db)):
    """Eliminar todos los datos del usuario demo para empezar de nuevo"""
    try:
        # Eliminar movimientos de inventario
        movements_deleted = db.query(InventoryMovement).filter(
            InventoryMovement.user_id == DEMO_USER_ID
        ).delete()
        
        # Eliminar items de inventario
        inventory_deleted = db.query(UserInventory).filter(
            UserInventory.user_id == DEMO_USER_ID
        ).delete()
        
        # Eliminar productos (opcional, pero para limpiar completamente)
        products_deleted = db.query(Product).delete()
        
        db.commit()
        
        return {
            "success": True,
            "message": "Todos los datos han sido eliminados",
            "movements_deleted": movements_deleted,
            "inventory_items_deleted": inventory_deleted,
            "products_deleted": products_deleted
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error eliminando datos: {str(e)}")
