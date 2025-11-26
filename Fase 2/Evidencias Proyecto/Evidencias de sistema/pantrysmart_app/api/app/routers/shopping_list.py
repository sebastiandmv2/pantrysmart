from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from typing import List, Optional
from app.db import get_db
from app.models import ShoppingListItem, ShoppingListItemStatus, Product, ProductCategory
from app.schemas import (
    ShoppingListItemCreate, ShoppingListItemUpdate, ShoppingListItemOut,
    AddToShoppingListRequest, BulkAddToShoppingListRequest, ShoppingListSummary,
    ShoppingListItemStatusEnum, ProductCategoryEnum
)

router = APIRouter(prefix="/shopping-list", tags=["shopping-list"])

def get_or_create_product_by_name(db: Session, ingredient_name: str) -> Product:
    """
    Busca un producto por nombre o lo crea automáticamente (reutilizada de recipes.py)
    """
    # Buscar producto existente (case-insensitive)
    product = db.query(Product).filter(
        func.lower(Product.name) == func.lower(ingredient_name)
    ).first()
    
    if product:
        return product
    
    # Crear producto automáticamente
    # Determinar categoría basada en el nombre (lógica simple)
    category_mapping = {
        "arroz": ProductCategory.ABARROTES,
        "fideos": ProductCategory.ABARROTES,
        "pasta": ProductCategory.ABARROTES,
        "harina": ProductCategory.ABARROTES,
        "aceite": ProductCategory.ABARROTES,
        "sal": ProductCategory.CONDIMENTOS,
        "azucar": ProductCategory.ABARROTES,
        "leche": ProductCategory.LACTEOS,
        "queso": ProductCategory.LACTEOS,
        "huevo": ProductCategory.LACTEOS,
        "pollo": ProductCategory.CARNES,
        "carne": ProductCategory.CARNES,
        "pan": ProductCategory.PANADERIA,
        "cebolla": ProductCategory.VERDURAS,
        "tomate": ProductCategory.VERDURAS,
        "ajo": ProductCategory.VERDURAS,
        "zanahoria": ProductCategory.VERDURAS,
        "pimentón": ProductCategory.VERDURAS,
        "pimiento": ProductCategory.VERDURAS,
        "espinaca": ProductCategory.VERDURAS,
        "lechuga": ProductCategory.VERDURAS,
        "manzana": ProductCategory.FRUTAS,
        "platano": ProductCategory.FRUTAS,
    }
    
    # Determinar categoría por palabras clave
    ingredient_lower = ingredient_name.lower()
    category = ProductCategory.ABARROTES  # Default
    
    for keyword, cat in category_mapping.items():
        if keyword in ingredient_lower:
            category = cat
            break
    
    # Crear nuevo producto
    new_product = Product(
        name=ingredient_name,
        category=category,
        default_unit="unidades",
        is_perishable=False
    )
    
    db.add(new_product)
    db.flush()  # Para obtener el ID
    
    return new_product

@router.get("/user/{user_id}", response_model=List[ShoppingListItemOut])
def get_user_shopping_list(
    user_id: str,
    status: Optional[ShoppingListItemStatusEnum] = Query(None, description="Filtrar por estado"),
    category: Optional[ProductCategoryEnum] = Query(None, description="Filtrar por categoría"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Obtener lista de compras del usuario con filtros opcionales
    """
    query = db.query(ShoppingListItem).options(
        joinedload(ShoppingListItem.product)
    ).filter(ShoppingListItem.user_id == user_id)
    
    # Filtros
    if status:
        query = query.filter(ShoppingListItem.status == status.value)
    
    if category:
        query = query.join(Product).filter(Product.category == category.value)
    
    # Ordenar por prioridad (1=alta primero) y fecha de creación
    query = query.order_by(ShoppingListItem.priority.asc(), ShoppingListItem.created_at.desc())
    
    items = query.offset(offset).limit(limit).all()
    return items

@router.get("/user/{user_id}/summary", response_model=ShoppingListSummary)
def get_shopping_list_summary(user_id: str, db: Session = Depends(get_db)):
    """
    Obtener resumen de la lista de compras del usuario
    """
    # Contar items por estado
    items = db.query(ShoppingListItem).filter(ShoppingListItem.user_id == user_id).all()
    
    total_items = len(items)
    pending_items = len([item for item in items if item.status == ShoppingListItemStatus.PENDING])
    purchased_items = len([item for item in items if item.status == ShoppingListItemStatus.PURCHASED])
    cancelled_items = len([item for item in items if item.status == ShoppingListItemStatus.CANCELLED])
    
    # Calcular costos
    estimated_total = sum([item.estimated_price or 0 for item in items if item.status == ShoppingListItemStatus.PENDING])
    actual_total = sum([item.actual_price or 0 for item in items if item.status == ShoppingListItemStatus.PURCHASED])
    
    # Items por categoría
    items_by_category = {}
    for item in items:
        if item.status == ShoppingListItemStatus.PENDING:
            category = item.product.category.value
            items_by_category[category] = items_by_category.get(category, 0) + 1
    
    return ShoppingListSummary(
        total_items=total_items,
        pending_items=pending_items,
        purchased_items=purchased_items,
        cancelled_items=cancelled_items,
        estimated_total_cost=estimated_total,
        actual_total_cost=actual_total,
        items_by_category=items_by_category
    )

@router.post("/add-item", response_model=ShoppingListItemOut)
def add_item_to_shopping_list(
    item_data: ShoppingListItemCreate,
    db: Session = Depends(get_db)
):
    """
    Agregar un item individual a la lista de compras
    """
    # Verificar que el producto existe
    product = db.query(Product).filter(Product.id == item_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Verificar si ya existe el item para evitar duplicados
    existing_item = db.query(ShoppingListItem).filter(
        and_(
            ShoppingListItem.user_id == item_data.user_id,
            ShoppingListItem.product_id == item_data.product_id,
            ShoppingListItem.status == ShoppingListItemStatus.PENDING
        )
    ).first()
    
    if existing_item:
        # Si ya existe, actualizar la cantidad
        existing_item.quantity_needed += item_data.quantity_needed
        existing_item.updated_at = func.now()
        if item_data.notes:
            existing_item.notes = item_data.notes
        db.commit()
        db.refresh(existing_item)
        return existing_item
    
    # Crear nuevo item
    shopping_item = ShoppingListItem(
        user_id=item_data.user_id,
        product_id=item_data.product_id,
        quantity_needed=item_data.quantity_needed,
        unit=item_data.unit,
        notes=item_data.notes,
        priority=item_data.priority.value,  # Usar .value para obtener el entero
        estimated_price=item_data.estimated_price,
        store_to_buy=item_data.store_to_buy,
        added_from_recipe_id=item_data.added_from_recipe_id,
        added_from_recipe_name=item_data.added_from_recipe_name
    )
    
    db.add(shopping_item)
    db.commit()
    db.refresh(shopping_item)
    
    return shopping_item

@router.post("/add-missing-ingredients", response_model=List[ShoppingListItemOut])
def add_missing_ingredients_to_shopping_list(
    request: AddToShoppingListRequest,
    db: Session = Depends(get_db)
):
    """
    Agregar ingredientes faltantes de una receta a la lista de compras
    """
    created_items = []
    
    for ingredient_name in request.ingredient_names:
        try:
            # Buscar o crear el producto
            product = get_or_create_product_by_name(db, ingredient_name)
            
            # Verificar si ya existe en la lista de compras
            existing_item = db.query(ShoppingListItem).filter(
                and_(
                    ShoppingListItem.user_id == request.user_id,
                    ShoppingListItem.product_id == product.id,
                    ShoppingListItem.status == ShoppingListItemStatus.PENDING
                )
            ).first()
            
            if existing_item:
                # Si ya existe, incrementar cantidad
                existing_item.quantity_needed += 1
                existing_item.updated_at = func.now()
                if request.recipe_name and not existing_item.added_from_recipe_name:
                    existing_item.added_from_recipe_name = request.recipe_name
                db.commit()
                db.refresh(existing_item)
                created_items.append(existing_item)
            else:
                # Crear nuevo item
                shopping_item = ShoppingListItem(
                    user_id=request.user_id,
                    product_id=product.id,
                    quantity_needed=1,  # Por defecto 1 unidad
                    unit="unidades",
                    priority=request.priority.value,  # Usar .value para obtener el entero
                    added_from_recipe_id=request.recipe_id,
                    added_from_recipe_name=request.recipe_name,
                    notes=f"Necesario para receta: {request.recipe_name}" if request.recipe_name else None
                )
                
                db.add(shopping_item)
                db.flush()  # Para obtener el ID
                created_items.append(shopping_item)
        
        except Exception as e:
            print(f"Error agregando ingrediente {ingredient_name}: {e}")
            continue
    
    db.commit()
    
    # Refrescar todos los items creados para obtener las relaciones
    for item in created_items:
        db.refresh(item)
    
    return created_items

@router.put("/items/{item_id}", response_model=ShoppingListItemOut)
def update_shopping_list_item(
    item_id: int,
    update_data: ShoppingListItemUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualizar un item de la lista de compras
    """
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    # Actualizar campos
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        if field == "status" and value:
            setattr(item, field, value.value)
        elif field == "priority" and value:
            setattr(item, field, value.value)
        else:
            setattr(item, field, value)
    
    # Si se marca como comprado, agregar fecha
    if update_data.status == ShoppingListItemStatusEnum.PURCHASED:
        item.purchased_date = func.now()
    
    item.updated_at = func.now()
    db.commit()
    db.refresh(item)
    
    return item

@router.delete("/items/{item_id}")
def delete_shopping_list_item(item_id: int, db: Session = Depends(get_db)):
    """
    Eliminar un item de la lista de compras
    """
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    db.delete(item)
    db.commit()
    
    return {"message": "Item eliminado correctamente"}

@router.post("/items/{item_id}/mark-purchased", response_model=ShoppingListItemOut)
def mark_item_as_purchased(
    item_id: int,
    actual_price: Optional[float] = Query(None, description="Precio real pagado"),
    db: Session = Depends(get_db)
):
    """
    Marcar un item como comprado
    """
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    item.status = ShoppingListItemStatus.PURCHASED
    item.purchased_date = func.now()
    item.updated_at = func.now()
    
    if actual_price is not None:
        item.actual_price = actual_price
    
    db.commit()
    db.refresh(item)
    
    return item

@router.post("/clear-purchased")
def clear_purchased_items(user_id: str, db: Session = Depends(get_db)):
    """
    Eliminar todos los items comprados de la lista
    """
    deleted_count = db.query(ShoppingListItem).filter(
        and_(
            ShoppingListItem.user_id == user_id,
            ShoppingListItem.status == ShoppingListItemStatus.PURCHASED
        )
    ).delete()
    
    db.commit()
    
    return {"message": f"Se eliminaron {deleted_count} items comprados"}