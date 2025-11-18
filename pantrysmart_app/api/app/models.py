from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base
import enum

class Receipt(Base):
    __tablename__ = "receipts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False)
    store = Column(String(255), nullable=True)  # sucursal_o_direccion del schema
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    items = relationship("ReceiptItem", back_populates="receipt", cascade="all, delete-orphan")

class ReceiptItem(Base):
    __tablename__ = "receipt_items"
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("receipts.id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String(255), nullable=False)  # NombreOriginal del schema
    product_type = Column(String(255), nullable=False)  # Producto del schema
    quantity = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    receipt = relationship("Receipt", back_populates="items")


# ===============================
# MODELOS DE INVENTARIO
# ===============================

class ProductCategory(enum.Enum):
    """Categorías de productos para organización"""
    ABARROTES = "Abarrotes"
    LACTEOS = "Lácteos"
    CARNES = "Carnes"
    EMBUTIDOS = "Embutidos"
    PANADERIA = "Panadería"
    VERDURAS = "Verduras"
    FRUTAS = "Frutas"
    CONGELADOS = "Congelados"
    DULCES = "Dulces"
    SNACKS = "Snacks"
    CONDIMENTOS = "Condimentos"
    BEBESTIBLES = "Bebestibles"
    LIMPIEZA = "Limpieza"
    CUIDADO_PERSONAL = "Cuidado Personal"
    MASCOTAS = "Mascotas"
    HOGAR = "Hogar"

class StockLevel(enum.Enum):
    """Niveles de stock para alertas"""
    ALTO = "alto"
    MEDIO = "medio"
    BAJO = "bajo"
    AGOTADO = "agotado"

class MovementType(enum.Enum):
    """Tipos de movimiento de inventario"""
    ADDED_RECEIPT = "added_receipt"      # Agregado desde boleta
    ADDED_MANUAL = "added_manual"        # Agregado manualmente
    CONSUMED = "consumed"                # Consumido (receta, uso)
    EXPIRED = "expired"                  # Vencido/descartado
    ADJUSTED = "adjusted"                # Ajuste manual
    REMOVED = "removed"                  # Eliminado

class Product(Base):
    """Catálogo general de productos disponibles"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)  # Nombre canónico del producto
    category = Column(Enum(ProductCategory), nullable=False, index=True)
    description = Column(Text, nullable=True)  # Descripción adicional
    default_unit = Column(String(50), nullable=True)  # kg, litros, unidades, etc.
    barcode = Column(String(100), nullable=True, unique=True, index=True)  # Código de barras
    is_perishable = Column(Boolean, default=False)  # Si es perecedero
    typical_shelf_life_days = Column(Integer, nullable=True)  # Vida útil típica en días
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relaciones
    inventory_items = relationship("UserInventory", back_populates="product")
    movements = relationship("InventoryMovement", back_populates="product")
    recipe_ingredients = relationship("RecipeIngredient")

class UserInventory(Base):
    """Inventario personal de cada usuario"""
    __tablename__ = "user_inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)  # ID del usuario
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    # Información de stock
    current_quantity = Column(Float, nullable=False, default=0.0)
    unit = Column(String(50), nullable=True)  # kg, litros, unidades
    stock_level = Column(Enum(StockLevel), nullable=False, default=StockLevel.MEDIO)
    
    # Información de compra/adquisición
    purchase_date = Column(DateTime, nullable=True)  # Última fecha de compra
    expiration_date = Column(DateTime, nullable=True)  # Fecha de vencimiento
    purchase_price = Column(Float, nullable=True)  # Precio de compra
    store_purchased = Column(String(255), nullable=True)  # Tienda donde se compró
    
    # Alertas y configuración
    min_stock_alert = Column(Float, nullable=True, default=1.0)  # Cantidad mínima antes de alerta
    auto_consume = Column(Boolean, default=True)  # Si se consume automáticamente en recetas
    
    # Metadatos
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relaciones
    product = relationship("Product", back_populates="inventory_items")
    movements = relationship("InventoryMovement", back_populates="inventory_item")
    
    # Índice compuesto para evitar duplicados por usuario-producto
    __table_args__ = (
        {"mysql_engine": "InnoDB"},
    )

class InventoryMovement(Base):
    """Historial de movimientos de inventario"""
    __tablename__ = "inventory_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    inventory_item_id = Column(Integer, ForeignKey("user_inventory.id", ondelete="CASCADE"), nullable=True)
    
    # Información del movimiento
    movement_type = Column(Enum(MovementType), nullable=False, index=True)
    quantity_change = Column(Float, nullable=False)  # Positivo = entrada, Negativo = salida
    quantity_before = Column(Float, nullable=False)  # Cantidad antes del movimiento
    quantity_after = Column(Float, nullable=False)   # Cantidad después del movimiento
    unit = Column(String(50), nullable=True)
    
    # Información contextual
    reason = Column(String(500), nullable=True)  # Razón del movimiento
    reference_id = Column(String(100), nullable=True)  # ID de referencia (receipt_id, recipe_id, etc.)
    reference_type = Column(String(50), nullable=True)  # Tipo de referencia (receipt, recipe, manual, etc.)
    
    # Información adicional
    cost_per_unit = Column(Float, nullable=True)  # Costo por unidad
    total_cost = Column(Float, nullable=True)     # Costo total del movimiento
    notes = Column(Text, nullable=True)           # Notas adicionales
    
    # Metadatos
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    created_by = Column(String(100), nullable=True)  # Usuario que hizo el movimiento
    
    # Relaciones
    product = relationship("Product", back_populates="movements")
    inventory_item = relationship("UserInventory", back_populates="movements")


# ===============================
# MODELOS DE RECETAS
# ===============================

class DifficultyLevel(enum.Enum):
    """Niveles de dificultad de recetas"""
    FACIL = "facil"
    INTERMEDIO = "intermedio"
    DIFICIL = "dificil"

class Recipe(Base):
    """Recetas guardadas en el sistema"""
    __tablename__ = "recipes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    difficulty = Column(Enum(DifficultyLevel), nullable=False, default=DifficultyLevel.FACIL)
    prep_time_minutes = Column(Integer, nullable=False)  # Tiempo de preparación en minutos
    cook_time_minutes = Column(Integer, nullable=True)   # Tiempo de cocción en minutos
    servings = Column(Integer, nullable=False, default=1)  # Número de porciones
    instructions = Column(Text, nullable=False)  # Instrucciones paso a paso
    image_url = Column(String(500), nullable=True)  # URL de imagen de la receta
    tags = Column(String(500), nullable=True)  # Tags separados por comas (ej: "vegetariano,facil,rapido")
    
    # Metadatos
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")

class RecipeIngredient(Base):
    """Ingredientes necesarios para cada receta"""
    __tablename__ = "recipe_ingredients"
    
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    # Información del ingrediente
    quantity_needed = Column(Float, nullable=False)  # Cantidad necesaria
    unit = Column(String(50), nullable=False)  # Unidad (kg, litros, unidades, etc.)
    is_optional = Column(Boolean, default=False, nullable=False)  # Si el ingrediente es opcional
    notes = Column(String(255), nullable=True)  # Notas adicionales (ej: "cortado en cubos")
    
    # Relaciones
    recipe = relationship("Recipe", back_populates="ingredients")
    product = relationship("Product")
