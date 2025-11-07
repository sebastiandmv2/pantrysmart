"""
Utilidades para el manejo del inventario
Funciones helper para operaciones comunes de inventario
"""

from sqlalchemy.orm import Session
from app.models import Product, UserInventory, InventoryMovement, ProductCategory, StockLevel, MovementType
from app.inventory_config import get_stock_level, is_perishable_category, get_default_shelf_life, get_default_unit
from typing import List, Optional, Dict, Tuple
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# ===============================
# FUNCIONES DE BÚSQUEDA Y CREACIÓN
# ===============================

def find_or_create_product(
    db: Session, 
    product_name: str, 
    category: ProductCategory,
    description: Optional[str] = None,
    barcode: Optional[str] = None
) -> Product:
    """
    Busca un producto por nombre o lo crea si no existe
    """
    # Buscar producto existente (case insensitive)
    existing_product = db.query(Product).filter(
        Product.name.ilike(f"%{product_name.strip()}%")
    ).first()
    
    if existing_product:
        return existing_product
    
    # Crear nuevo producto
    new_product = Product(
        name=product_name.strip(),
        category=category,
        description=description or f"Producto {product_name}",
        default_unit=get_default_unit(category),
        barcode=barcode,
        is_perishable=is_perishable_category(category),
        typical_shelf_life_days=get_default_shelf_life(category)
    )
    
    db.add(new_product)
    db.flush()  # Para obtener el ID
    
    logger.info(f"Producto creado: {product_name} (ID: {new_product.id})")
    return new_product

def get_or_create_inventory_item(
    db: Session,
    user_id: str,
    product: Product,
    initial_quantity: float = 0.0,
    unit: Optional[str] = None,
    purchase_date: Optional[datetime] = None,
    expiration_date: Optional[datetime] = None,
    store_purchased: Optional[str] = None,
    purchase_price: Optional[float] = None
) -> UserInventory:
    """
    Obtiene el item de inventario del usuario o lo crea si no existe
    """
    # Buscar item existente
    inventory_item = db.query(UserInventory).filter(
        UserInventory.user_id == user_id,
        UserInventory.product_id == product.id
    ).first()
    
    if inventory_item:
        return inventory_item
    
    # Calcular fecha de vencimiento si no se proporciona
    if not expiration_date and product.is_perishable and product.typical_shelf_life_days:
        base_date = purchase_date or datetime.utcnow()
        expiration_date = base_date + timedelta(days=product.typical_shelf_life_days)
    
    # Crear nuevo item de inventario
    inventory_item = UserInventory(
        user_id=user_id,
        product_id=product.id,
        current_quantity=initial_quantity,
        unit=unit or product.default_unit,
        stock_level=get_stock_level(initial_quantity),
        purchase_date=purchase_date,
        expiration_date=expiration_date,
        purchase_price=purchase_price,
        store_purchased=store_purchased
    )
    
    db.add(inventory_item)
    db.flush()
    
    logger.info(f"Item de inventario creado: {product.name} para usuario {user_id}")
    return inventory_item

# ===============================
# FUNCIONES DE MOVIMIENTO
# ===============================

def add_inventory_movement(
    db: Session,
    user_id: str,
    product: Product,
    inventory_item: UserInventory,
    movement_type: MovementType,
    quantity_change: float,
    reason: Optional[str] = None,
    reference_id: Optional[str] = None,
    reference_type: Optional[str] = None,
    cost_per_unit: Optional[float] = None,
    notes: Optional[str] = None,
    created_by: Optional[str] = None
) -> InventoryMovement:
    """
    Registra un movimiento de inventario
    """
    quantity_before = inventory_item.current_quantity
    quantity_after = max(0, quantity_before + quantity_change)
    
    movement = InventoryMovement(
        user_id=user_id,
        product_id=product.id,
        inventory_item_id=inventory_item.id,
        movement_type=movement_type,
        quantity_change=quantity_change,
        quantity_before=quantity_before,
        quantity_after=quantity_after,
        unit=inventory_item.unit,
        reason=reason,
        reference_id=reference_id,
        reference_type=reference_type,
        cost_per_unit=cost_per_unit,
        total_cost=cost_per_unit * abs(quantity_change) if cost_per_unit else None,
        notes=notes,
        created_by=created_by or user_id
    )
    
    db.add(movement)
    
    # Actualizar cantidad en inventario
    inventory_item.current_quantity = quantity_after
    inventory_item.stock_level = get_stock_level(quantity_after, inventory_item.min_stock_alert)
    inventory_item.updated_at = datetime.utcnow()
    
    logger.info(f"Movimiento registrado: {movement_type.value} - {product.name} - {quantity_change}")
    return movement

def add_to_inventory(
    db: Session,
    user_id: str,
    product_name: str,
    category: ProductCategory,
    quantity: float,
    unit: Optional[str] = None,
    purchase_date: Optional[datetime] = None,
    expiration_date: Optional[datetime] = None,
    store_purchased: Optional[str] = None,
    purchase_price: Optional[float] = None,
    movement_type: MovementType = MovementType.ADDED_MANUAL,
    reference_id: Optional[str] = None,
    reference_type: Optional[str] = None
) -> Tuple[UserInventory, InventoryMovement]:
    """
    Agrega cantidad a un producto en el inventario
    """
    # Buscar o crear producto
    product = find_or_create_product(db, product_name, category)
    
    # Obtener o crear item de inventario
    inventory_item = get_or_create_inventory_item(
        db=db,
        user_id=user_id,
        product=product,
        unit=unit,
        purchase_date=purchase_date,
        expiration_date=expiration_date,
        store_purchased=store_purchased,
        purchase_price=purchase_price
    )
    
    # Registrar movimiento
    movement = add_inventory_movement(
        db=db,
        user_id=user_id,
        product=product,
        inventory_item=inventory_item,
        movement_type=movement_type,
        quantity_change=quantity,
        reason=f"Agregado {quantity} {unit or 'unidades'} de {product_name}",
        reference_id=reference_id,
        reference_type=reference_type,
        cost_per_unit=purchase_price
    )
    
    return inventory_item, movement

def consume_from_inventory(
    db: Session,
    user_id: str,
    product_id: int,
    quantity: float,
    reason: Optional[str] = None,
    reference_id: Optional[str] = None,
    reference_type: Optional[str] = None
) -> Optional[InventoryMovement]:
    """
    Consume cantidad de un producto del inventario
    """
    # Buscar item de inventario
    inventory_item = db.query(UserInventory).filter(
        UserInventory.user_id == user_id,
        UserInventory.product_id == product_id
    ).first()
    
    if not inventory_item:
        logger.warning(f"No se encontró item de inventario para producto {product_id} y usuario {user_id}")
        return None
    
    if inventory_item.current_quantity < quantity:
        logger.warning(f"Cantidad insuficiente en inventario: {inventory_item.current_quantity} < {quantity}")
        return None
    
    # Registrar movimiento de consumo
    movement = add_inventory_movement(
        db=db,
        user_id=user_id,
        product=inventory_item.product,
        inventory_item=inventory_item,
        movement_type=MovementType.CONSUMED,
        quantity_change=-quantity,
        reason=reason or f"Consumido {quantity} {inventory_item.unit}",
        reference_id=reference_id,
        reference_type=reference_type
    )
    
    return movement

# ===============================
# FUNCIONES DE CONSULTA
# ===============================

def get_user_inventory_summary(db: Session, user_id: str) -> Dict:
    """
    Obtiene un resumen del inventario del usuario
    """
    inventory_items = db.query(UserInventory).filter(
        UserInventory.user_id == user_id
    ).all()
    
    total_products = len(inventory_items)
    low_stock_products = len([item for item in inventory_items if item.stock_level in [StockLevel.BAJO, StockLevel.AGOTADO]])
    
    # Productos próximos a vencer (en los próximos 3 días)
    soon_expiry = datetime.utcnow() + timedelta(days=3)
    expired_soon_products = len([
        item for item in inventory_items 
        if item.expiration_date and item.expiration_date <= soon_expiry
    ])
    
    # Resumen por categoría
    categories_summary = {}
    for item in inventory_items:
        category = item.product.category
        if category not in categories_summary:
            categories_summary[category] = {
                "total_products": 0,
                "total_quantity": 0.0,
                "low_stock_count": 0,
                "expired_soon_count": 0
            }
        
        categories_summary[category]["total_products"] += 1
        categories_summary[category]["total_quantity"] += item.current_quantity
        
        if item.stock_level in [StockLevel.BAJO, StockLevel.AGOTADO]:
            categories_summary[category]["low_stock_count"] += 1
            
        if item.expiration_date and item.expiration_date <= soon_expiry:
            categories_summary[category]["expired_soon_count"] += 1
    
    return {
        "total_products": total_products,
        "total_categories": len(categories_summary),
        "low_stock_products": low_stock_products,
        "expired_soon_products": expired_soon_products,
        "categories": categories_summary,
        "last_updated": datetime.utcnow()
    }

def get_products_by_category(db: Session, user_id: str, category: ProductCategory) -> List[UserInventory]:
    """
    Obtiene todos los productos de una categoría específica para un usuario
    """
    return db.query(UserInventory).join(Product).filter(
        UserInventory.user_id == user_id,
        Product.category == category
    ).all()

def get_low_stock_products(db: Session, user_id: str) -> List[UserInventory]:
    """
    Obtiene productos con stock bajo o agotado
    """
    return db.query(UserInventory).filter(
        UserInventory.user_id == user_id,
        UserInventory.stock_level.in_([StockLevel.BAJO, StockLevel.AGOTADO])
    ).all()

def get_expiring_soon_products(db: Session, user_id: str, days: int = 3) -> List[UserInventory]:
    """
    Obtiene productos que vencen pronto
    """
    expiry_date = datetime.utcnow() + timedelta(days=days)
    return db.query(UserInventory).filter(
        UserInventory.user_id == user_id,
        UserInventory.expiration_date <= expiry_date,
        UserInventory.expiration_date >= datetime.utcnow()
    ).all()

def search_products(db: Session, query: str, limit: int = 10) -> List[Product]:
    """
    Busca productos por nombre
    """
    return db.query(Product).filter(
        Product.name.ilike(f"%{query}%")
    ).limit(limit).all()

# ===============================
# FUNCIONES DE INTEGRACIÓN CON BOLETAS
# ===============================

def process_receipt_items_to_inventory(
    db: Session,
    user_id: str,
    receipt_items: List[Dict],
    store_name: Optional[str] = None,
    receipt_id: Optional[int] = None
) -> List[Tuple[UserInventory, InventoryMovement]]:
    """
    Procesa items de una boleta y los agrega al inventario
    """
    from app.schemas import PRODUCT_TYPES
    from app.models import ProductCategory
    
    # Mapeo completo de tipos de productos a categorías
    TYPE_TO_CATEGORY = {
        # Abarrotes básicos
        'Arroz': ProductCategory.ABARROTES,
        'Fideos': ProductCategory.ABARROTES,
        'Fideo': ProductCategory.ABARROTES,
        'Azucar': ProductCategory.ABARROTES,
        'Harina': ProductCategory.ABARROTES,
        'Sopa': ProductCategory.ABARROTES,
        'Ravioles': ProductCategory.ABARROTES,
        
        # Lácteos
        'Leche': ProductCategory.LACTEOS,
        'Leche evaporada': ProductCategory.LACTEOS,
        'Queso': ProductCategory.LACTEOS,
        'Yogur': ProductCategory.LACTEOS,
        'Mantequilla': ProductCategory.LACTEOS,
        'Huevo': ProductCategory.LACTEOS,
        
        # Carnes y proteínas
        'Atun': ProductCategory.CARNES,
        'Pollo': ProductCategory.CARNES,
        'Carne molida': ProductCategory.CARNES,
        'Hamburguesa': ProductCategory.CARNES,
        'Gallina': ProductCategory.CARNES,
        
        # Panadería
        'Pan': ProductCategory.PANADERIA,
        
        # Frutas
        'Manzana': ProductCategory.FRUTAS,
        'Platano': ProductCategory.FRUTAS,
        'Fruta': ProductCategory.FRUTAS,
        'Berries': ProductCategory.FRUTAS,
        
        # Verduras
        'Cebolla': ProductCategory.VERDURAS,
        'Tomate': ProductCategory.VERDURAS,
        'Ajo': ProductCategory.VERDURAS,
        'Zanahoria': ProductCategory.VERDURAS,
        
        # Condimentos y salsas
        'Aceite': ProductCategory.CONDIMENTOS,
        'Sal': ProductCategory.CONDIMENTOS,
        'Salsa de tomate': ProductCategory.CONDIMENTOS,
        
        # Congelados
        'Helado': ProductCategory.CONGELADOS,
        
        # Otros
        'Otros': ProductCategory.ABARROTES,
    }
    
    results = []
    purchase_date = datetime.utcnow()
    
    for item in receipt_items:
        product_name = item.get('product_name', '')
        product_type = item.get('product_type', 'Otros')
        quantity = float(item.get('quantity', 1))
        
        # Determinar categoría
        category = TYPE_TO_CATEGORY.get(product_type, ProductCategory.ABARROTES)
        
        try:
            # Verificar si el producto ya existe en el inventario del usuario
            existing_inventory = db.query(UserInventory).join(Product).filter(
                UserInventory.user_id == user_id,
                Product.name.ilike(f"%{product_name.strip()}%")
            ).first()
            
            if existing_inventory:
                # Si existe, agregar a la cantidad existente
                logger.info(f"Producto existente encontrado: {product_name}, agregando {quantity}")
                movement = add_inventory_movement(
                    db=db,
                    user_id=user_id,
                    product=existing_inventory.product,
                    inventory_item=existing_inventory,
                    movement_type=MovementType.ADDED_RECEIPT,
                    quantity_change=quantity,
                    reason=f"Agregado desde boleta: {quantity} unidades",
                    reference_id=str(receipt_id) if receipt_id else None,
                    reference_type="receipt"
                )
                results.append((existing_inventory, movement))
            else:
                # Si no existe, crear nuevo item
                inventory_item, movement = add_to_inventory(
                    db=db,
                    user_id=user_id,
                    product_name=product_name,
                    category=category,
                    quantity=quantity,
                    purchase_date=purchase_date,
                    store_purchased=store_name,
                    movement_type=MovementType.ADDED_RECEIPT,
                    reference_id=str(receipt_id) if receipt_id else None,
                    reference_type="receipt"
                )
                results.append((inventory_item, movement))
                
        except Exception as e:
            logger.error(f"Error procesando item {product_name}: {e}")
            # Continuar con el siguiente item en caso de error
            continue
    
    return results