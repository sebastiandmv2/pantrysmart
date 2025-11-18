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
    Busca un producto genérico por nombre exacto o lo crea si no existe
    SIMPLIFICADO: Solo unidades enteras
    """
    # Buscar producto existente por nombre exacto (para productos genéricos)
    existing_product = db.query(Product).filter(
        Product.name == product_name.strip()
    ).first()
    
    if existing_product:
        return existing_product
    
    # Crear nuevo producto genérico ULTRA-SIMPLIFICADO
    new_product = Product(
        name=product_name.strip(),
        category=category,
        description=f"Producto genérico: {product_name}",
        default_unit="unidades",  # SIEMPRE unidades
        barcode=None,  # No necesario para POC
        is_perishable=False,  # No fechas para POC
        typical_shelf_life_days=None  # No necesario para POC
    )
    
    db.add(new_product)
    db.flush()  # Para obtener el ID
    
    logger.info(f"Producto genérico creado: {product_name} (ID: {new_product.id})")
    return new_product

def get_or_create_inventory_item(
    db: Session,
    user_id: str,
    product: Product,
    initial_quantity: int = 0,
    store_purchased: Optional[str] = None
) -> UserInventory:
    """
    Obtiene el item de inventario del usuario o lo crea si no existe
    ULTRA-SIMPLIFICADO: Solo unidades enteras, sin fechas ni precios
    """
    # Buscar item existente
    inventory_item = db.query(UserInventory).filter(
        UserInventory.user_id == user_id,
        UserInventory.product_id == product.id
    ).first()
    
    if inventory_item:
        return inventory_item
    
    # Crear nuevo item ULTRA-SIMPLIFICADO
    inventory_item = UserInventory(
        user_id=user_id,
        product_id=product.id,
        current_quantity=float(initial_quantity),  # Convertir a float para BD
        unit="unidades",  # SIEMPRE unidades
        stock_level=StockLevel.MEDIO,
        purchase_date=None,  # Sin fechas
        expiration_date=None,  # Sin fechas
        purchase_price=None,  # Sin precios
        store_purchased=store_purchased,
        min_stock_alert=1.0,  # Siempre 1
        auto_consume=True
    )
    
    db.add(inventory_item)
    db.flush()
    
    logger.info(f"Item de inventario SIMPLIFICADO creado: {product.name} para usuario {user_id}")
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
    quantity_change: int,  # SOLO ENTEROS
    reason: Optional[str] = None,
    reference_id: Optional[str] = None,
    reference_type: Optional[str] = None,
    notes: Optional[str] = None,
    created_by: Optional[str] = None
) -> InventoryMovement:
    """
    Registra un movimiento de inventario - SIMPLIFICADO: solo enteros
    """
    quantity_before = int(inventory_item.current_quantity)  # Convertir a entero
    quantity_after = max(0, quantity_before + quantity_change)
    
    movement = InventoryMovement(
        user_id=user_id,
        product_id=product.id,
        inventory_item_id=inventory_item.id,
        movement_type=movement_type,
        quantity_change=float(quantity_change),  # Convertir a float para BD
        quantity_before=float(quantity_before),  # Convertir a float para BD
        quantity_after=float(quantity_after),    # Convertir a float para BD
        unit="unidades",  # SIEMPRE unidades
        reason=reason,
        reference_id=reference_id,
        reference_type=reference_type,
        cost_per_unit=None,  # Sin costos para POC
        total_cost=None,     # Sin costos para POC
        notes=notes,
        created_by=created_by or user_id
    )
    
    db.add(movement)
    
    # Actualizar cantidad en inventario
    inventory_item.current_quantity = float(quantity_after)  # Convertir a float para BD
    inventory_item.stock_level = get_stock_level(quantity_after, int(inventory_item.min_stock_alert))
    inventory_item.updated_at = datetime.utcnow()
    
    logger.info(f"Movimiento SIMPLIFICADO registrado: {movement_type.value} - {product.name} - {quantity_change}")
    return movement

def add_to_inventory(
    db: Session,
    user_id: str,
    product_name: str,
    category: ProductCategory,
    quantity: int,  # SOLO ENTEROS
    store_purchased: Optional[str] = None,
    movement_type: MovementType = MovementType.ADDED_MANUAL,
    reference_id: Optional[str] = None,
    reference_type: Optional[str] = None
) -> Tuple[UserInventory, InventoryMovement]:
    """
    Agrega cantidad a un producto genérico en el inventario
    ULTRA-SIMPLIFICADO: Solo unidades enteras
    """
    # Buscar o crear producto genérico
    product = find_or_create_product(db, product_name, category)
    
    # Obtener o crear item de inventario SIMPLIFICADO
    inventory_item = get_or_create_inventory_item(
        db=db,
        user_id=user_id,
        product=product,
        store_purchased=store_purchased
    )
    
    # Registrar movimiento SIMPLIFICADO
    movement = add_inventory_movement(
        db=db,
        user_id=user_id,
        product=product,
        inventory_item=inventory_item,
        movement_type=movement_type,
        quantity_change=quantity,
        reason=f"Agregado {quantity} unidades de {product_name}",
        reference_id=reference_id,
        reference_type=reference_type
    )
    
    return inventory_item, movement

def consume_from_inventory(
    db: Session,
    user_id: str,
    product_id: int,
    quantity: int,  # SOLO ENTEROS
    reason: Optional[str] = None,
    reference_id: Optional[str] = None,
    reference_type: Optional[str] = None
) -> Optional[InventoryMovement]:
    """
    Consume cantidad de un producto del inventario - SIMPLIFICADO
    """
    # Buscar item de inventario
    inventory_item = db.query(UserInventory).filter(
        UserInventory.user_id == user_id,
        UserInventory.product_id == product_id
    ).first()
    
    if not inventory_item:
        logger.warning(f"No se encontró item de inventario para producto {product_id} y usuario {user_id}")
        return None
    
    current_quantity = int(inventory_item.current_quantity)  # Convertir a entero
    if current_quantity < quantity:
        logger.warning(f"Cantidad insuficiente en inventario: {current_quantity} < {quantity}")
        return None
    
    # Registrar movimiento de consumo SIMPLIFICADO
    movement = add_inventory_movement(
        db=db,
        user_id=user_id,
        product=inventory_item.product,
        inventory_item=inventory_item,
        movement_type=MovementType.CONSUMED,
        quantity_change=-quantity,
        reason=reason or f"Consumido {quantity} unidades",
        reference_id=reference_id,
        reference_type=reference_type
    )
    
    return movement

# ===============================
# FUNCIONES DE CONSULTA
# ===============================

def get_user_inventory_summary(db: Session, user_id: str) -> Dict:
    """
    Obtiene un resumen del inventario del usuario - Versión simplificada y robusta
    """
    logger.info(f"Iniciando get_user_inventory_summary para usuario: {user_id}")
    
    try:
        # Paso 1: Verificar que el usuario existe en la tabla
        logger.info("Paso 1: Contando items de inventario...")
        total_products = db.query(UserInventory).filter(UserInventory.user_id == user_id).count()
        logger.info(f"Total productos encontrados: {total_products}")
        
        if total_products == 0:
            logger.info("No hay productos para este usuario, retornando resumen vacío")
            return {
                "total_products": 0,
                "total_categories": 0,
                "low_stock_products": 0,
                "expired_soon_products": 0,
                "categories": {},
                "last_updated": datetime.utcnow()
            }
        
        # Paso 2: Contar productos con stock bajo (sin JOIN)
        logger.info("Paso 2: Contando productos con stock bajo...")
        low_stock_products = db.query(UserInventory).filter(
            UserInventory.user_id == user_id,
            UserInventory.stock_level.in_([StockLevel.BAJO, StockLevel.AGOTADO])
        ).count()
        logger.info(f"Productos con stock bajo: {low_stock_products}")
        
        # Paso 3: Contar productos próximos a vencer
        logger.info("Paso 3: Contando productos próximos a vencer...")
        soon_expiry = datetime.utcnow() + timedelta(days=3)
        expired_soon_products = db.query(UserInventory).filter(
            UserInventory.user_id == user_id,
            UserInventory.expiration_date <= soon_expiry,
            UserInventory.expiration_date >= datetime.utcnow()
        ).count()
        logger.info(f"Productos próximos a vencer: {expired_soon_products}")
        
        # Paso 4: Obtener categorías únicas (con JOIN pero más simple)
        logger.info("Paso 4: Obteniendo categorías...")
        try:
            # Query más simple para obtener categorías
            categories_query = db.query(Product.category).join(UserInventory).filter(
                UserInventory.user_id == user_id
            ).distinct().all()
            
            unique_categories = [cat[0] for cat in categories_query]
            total_categories = len(unique_categories)
            logger.info(f"Categorías encontradas: {total_categories}")
            
        except Exception as e:
            logger.error(f"Error obteniendo categorías: {e}")
            total_categories = 0
            unique_categories = []
        
        # Paso 5: Crear resumen básico sin detalles por categoría
        logger.info("Paso 5: Creando resumen final...")
        summary = {
            "total_products": total_products,
            "total_categories": total_categories,
            "low_stock_products": low_stock_products,
            "expired_soon_products": expired_soon_products,
            "categories": {},  # Temporalmente vacío para evitar errores
            "last_updated": datetime.utcnow()
        }
        
        logger.info(f"Resumen creado exitosamente: {summary}")
        return summary
        
    except Exception as e:
        logger.error(f"Error crítico en get_user_inventory_summary: {e}")
        logger.error(f"Tipo de error: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback completo: {traceback.format_exc()}")
        
        # Retornar un resumen completamente vacío en caso de error
        return {
            "total_products": 0,
            "total_categories": 0,
            "low_stock_products": 0,
            "expired_soon_products": 0,
            "categories": {},
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
    Procesa items de una boleta y los agrega al inventario usando tipos genéricos
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
        'Pimienta': ProductCategory.CONDIMENTOS,
        
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
    
    for item in receipt_items:
        product_name = item.get('product_name', '')
        product_type = item.get('product_type', 'Otros')
        quantity = float(item.get('quantity', 1))
        
        # CAMBIO CLAVE: Usar el product_type genérico en lugar del product_name específico
        generic_product_name = product_type  # Esto es "Pimienta", no "PIMIENTA ROJ"
        category = TYPE_TO_CATEGORY.get(product_type, ProductCategory.ABARROTES)
        
        try:
            # Buscar si ya existe este tipo genérico de producto en el inventario
            existing_inventory = db.query(UserInventory).join(Product).filter(
                UserInventory.user_id == user_id,
                Product.name == generic_product_name  # Buscar exactamente por tipo genérico
            ).first()
            
            if existing_inventory:
                # Si existe, agregar a la cantidad existente
                logger.info(f"Producto genérico existente encontrado: {generic_product_name}, agregando {quantity}")
                movement = add_inventory_movement(
                    db=db,
                    user_id=user_id,
                    product=existing_inventory.product,
                    inventory_item=existing_inventory,
                    movement_type=MovementType.ADDED_RECEIPT,
                    quantity_change=int(quantity),  # Convertir a entero
                    reason=f"Agregado desde boleta: {quantity} unidades de {generic_product_name}",
                    reference_id=str(receipt_id) if receipt_id else None,
                    reference_type="receipt"
                )
                results.append((existing_inventory, movement))
            else:
                # Si no existe, crear nuevo item con nombre genérico
                inventory_item, movement = add_to_inventory(
                    db=db,
                    user_id=user_id,
                    product_name=generic_product_name,  # Usar nombre genérico
                    category=category,
                    quantity=int(quantity),  # Convertir a entero
                    store_purchased=store_name,
                    movement_type=MovementType.ADDED_RECEIPT,
                    reference_id=str(receipt_id) if receipt_id else None,
                    reference_type="receipt"
                )
                results.append((inventory_item, movement))
                
        except Exception as e:
            logger.error(f"Error procesando item {generic_product_name}: {e}")
            # Continuar con el siguiente item en caso de error
            continue
    
    return results

# ===============================
# FUNCIONES DE AGRUPACIÓN POR PRODUCTO GENÉRICO
# ===============================

def get_user_inventory_grouped_by_product_type(db: Session, user_id: str) -> List[Dict]:
    """
    Obtiene el inventario simplificado por tipo de producto genérico
    Solo muestra: nombre genérico, categoría, cantidad total y unidad
    """
    try:
        # Obtener todos los items del inventario con productos
        inventory_items = db.query(UserInventory).join(Product).filter(
            UserInventory.user_id == user_id
        ).all()
        
        # Agrupar por tipo de producto genérico
        grouped_products = {}
        
        for item in inventory_items:
            # Ya que ahora guardamos productos genéricos, usar el nombre directamente
            product_type = item.product.name  # Esto ya debería ser genérico como "Pimienta"
            
            if product_type not in grouped_products:
                grouped_products[product_type] = {
                    "product_type": product_type,
                    "category": item.product.category.value,  # Convertir enum a string
                    "total_quantity": 0.0,
                    "unit": item.unit,
                    "items_count": 1  # Simplificado: siempre 1 porque son productos genéricos
                }
            
            # Agregar cantidad al grupo
            grouped_products[product_type]["total_quantity"] += item.current_quantity
        
        # Convertir a lista y ordenar por nombre
        result = list(grouped_products.values())
        result.sort(key=lambda x: x["product_type"])
        
        return result
        
    except Exception as e:
        logger.error(f"Error en get_user_inventory_grouped_by_product_type: {e}")
        return []

def extract_generic_product_type(product_name: str) -> str:
    """
    Extrae el tipo genérico de un nombre de producto específico
    Ejemplos:
    - "Lechuga Iceberg" -> "Lechuga"
    - "Arroz Grado 1 1kg" -> "Arroz"
    - "Leche Entera Soprole 1L" -> "Leche"
    """
    # Diccionario de palabras clave para identificar tipos genéricos
    generic_types = {
        # Lácteos
        'leche': 'Leche',
        'queso': 'Queso', 
        'yogur': 'Yogur',
        'yogurt': 'Yogur',
        'mantequilla': 'Mantequilla',
        'huevo': 'Huevo',
        
        # Carnes
        'pollo': 'Pollo',
        'carne': 'Carne',
        'atun': 'Atún',
        'salmon': 'Salmón',
        'cerdo': 'Cerdo',
        
        # Verduras
        'lechuga': 'Lechuga',
        'tomate': 'Tomate',
        'cebolla': 'Cebolla',
        'zanahoria': 'Zanahoria',
        'apio': 'Apio',
        'pimiento': 'Pimiento',
        'ajo': 'Ajo',
        'papa': 'Papa',
        'papas': 'Papa',
        
        # Frutas
        'manzana': 'Manzana',
        'platano': 'Plátano',
        'banana': 'Plátano',
        'naranja': 'Naranja',
        'limon': 'Limón',
        'palta': 'Palta',
        'aguacate': 'Palta',
        
        # Abarrotes
        'arroz': 'Arroz',
        'fideos': 'Fideos',
        'pasta': 'Fideos',
        'harina': 'Harina',
        'azucar': 'Azúcar',
        'aceite': 'Aceite',
        'sal': 'Sal',
        'pan': 'Pan',
        
        # Condimentos
        'salsa': 'Salsa',
        'mayonesa': 'Mayonesa',
        'mostaza': 'Mostaza',
        'ketchup': 'Ketchup',
        
        # Otros
        'agua': 'Agua',
        'bebida': 'Bebida',
        'jugo': 'Jugo',
    }
    
    product_lower = product_name.lower()
    
    # Buscar coincidencias en el nombre
    for keyword, generic_type in generic_types.items():
        if keyword in product_lower:
            return generic_type
    
    # Si no encuentra coincidencia, usar la primera palabra del nombre
    first_word = product_name.split()[0] if product_name.split() else product_name
    return first_word.capitalize()

def get_inventory_summary_by_generic_type(db: Session, user_id: str) -> Dict:
    """
    Obtiene un resumen del inventario agrupado por tipo genérico
    """
    try:
        grouped_inventory = get_user_inventory_grouped_by_product_type(db, user_id)
        
        total_generic_types = len(grouped_inventory)
        low_stock_types = len([item for item in grouped_inventory if item["stock_level"] in [StockLevel.BAJO, StockLevel.AGOTADO]])
        
        # Agrupar por categoría
        categories_summary = {}
        for item in grouped_inventory:
            category = item["category"]
            if category not in categories_summary:
                categories_summary[category] = {
                    "generic_types_count": 0,
                    "total_quantity": 0.0,
                    "low_stock_count": 0
                }
            
            categories_summary[category]["generic_types_count"] += 1
            categories_summary[category]["total_quantity"] += item["total_quantity"]
            
            if item["stock_level"] in [StockLevel.BAJO, StockLevel.AGOTADO]:
                categories_summary[category]["low_stock_count"] += 1
        
        return {
            "total_generic_types": total_generic_types,
            "total_categories": len(categories_summary),
            "low_stock_types": low_stock_types,
            "categories": categories_summary,
            "grouped_inventory": grouped_inventory,
            "last_updated": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error en get_inventory_summary_by_generic_type: {e}")
        return {
            "total_generic_types": 0,
            "total_categories": 0,
            "low_stock_types": 0,
            "categories": {},
            "grouped_inventory": [],
            "last_updated": datetime.utcnow()
        }
