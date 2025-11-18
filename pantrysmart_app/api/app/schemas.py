from pydantic import BaseModel, Field, conint, confloat
from typing import List, Optional
from datetime import datetime
from enum import Enum

# Tipos de productos canónicos para el inventario
PRODUCT_TYPES = [
    # Abarrotes básicos
    'Arroz', 'Fideos', 'Fideo', 'Azucar', 'Harina', 'Aceite', 'Sal',
    # Lácteos
    'Leche', 'Leche evaporada', 'Queso', 'Yogur', 'Mantequilla',
    # Carnes y proteínas
    'Atun', 'Pollo', 'Carne molida', 'Hamburguesa', 'Huevo',
    # Panadería
    'Pan', 'Gallina',
    # Frutas
    'Manzana', 'Platano', 'Fruta', 'Berries',
    # Verduras
    'Cebolla', 'Tomate', 'Ajo', 'Zanahoria',
    # Condimentos y salsas
    'Salsa de tomate', 'Sopa',
    # Pastas
    'Ravioles',
    # Congelados
    'Helado',
    # Otros
    'Otros'
]

class ReceiptItemIn(BaseModel):
    product_name: str  # NombreOriginal
    product_type: str = Field(..., description=f"One of: {PRODUCT_TYPES}")
    quantity: conint(ge=1)

class ReceiptConfirmIn(BaseModel):
    user_id: Optional[str] = None
    store: Optional[str] = None  # sucursal_o_direccion
    items: List[ReceiptItemIn]

class ReceiptItemOut(BaseModel):
    id: int
    product_name: str
    product_type: str
    quantity: int
    is_active: bool
    class Config:
        from_attributes = True

class ReceiptOut(BaseModel):
    id: int
    user_id: str
    store: Optional[str]
    items: List[ReceiptItemOut]
    created_at: datetime
    inventory_items_added: Optional[int] = None  # Cantidad de items agregados al inventario
    
    class Config:
        from_attributes = True


# ===============================
# SCHEMAS DE INVENTARIO
# ===============================

class ProductCategoryEnum(str, Enum):
    """Categorías de productos"""
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

class StockLevelEnum(str, Enum):
    """Niveles de stock"""
    ALTO = "alto"
    MEDIO = "medio"
    BAJO = "bajo"
    AGOTADO = "agotado"

class MovementTypeEnum(str, Enum):
    """Tipos de movimiento de inventario"""
    ADDED_RECEIPT = "added_receipt"
    ADDED_MANUAL = "added_manual"
    CONSUMED = "consumed"
    EXPIRED = "expired"
    ADJUSTED = "adjusted"
    REMOVED = "removed"

# ===============================
# PRODUCT SCHEMAS
# ===============================

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: ProductCategoryEnum
    description: Optional[str] = None
    default_unit: Optional[str] = Field(None, max_length=50)
    barcode: Optional[str] = Field(None, max_length=100)
    is_perishable: bool = False
    typical_shelf_life_days: Optional[int] = Field(None, ge=1)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[ProductCategoryEnum] = None
    description: Optional[str] = None
    default_unit: Optional[str] = Field(None, max_length=50)
    barcode: Optional[str] = Field(None, max_length=100)
    is_perishable: Optional[bool] = None
    typical_shelf_life_days: Optional[int] = Field(None, ge=1)

class ProductOut(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ===============================
# USER INVENTORY SCHEMAS
# ===============================

class UserInventoryBase(BaseModel):
    current_quantity: confloat(ge=0.0)
    unit: Optional[str] = Field(None, max_length=50)
    stock_level: StockLevelEnum = StockLevelEnum.MEDIO
    purchase_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    purchase_price: Optional[confloat(ge=0.0)] = None
    store_purchased: Optional[str] = Field(None, max_length=255)
    min_stock_alert: Optional[confloat(ge=0.0)] = 1.0
    auto_consume: bool = True

class UserInventoryCreate(UserInventoryBase):
    product_id: int
    user_id: str = Field(..., max_length=100)

class UserInventoryUpdate(BaseModel):
    current_quantity: Optional[confloat(ge=0.0)] = None
    unit: Optional[str] = Field(None, max_length=50)
    stock_level: Optional[StockLevelEnum] = None
    purchase_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    purchase_price: Optional[confloat(ge=0.0)] = None
    store_purchased: Optional[str] = Field(None, max_length=255)
    min_stock_alert: Optional[confloat(ge=0.0)] = None
    auto_consume: Optional[bool] = None

class UserInventoryOut(UserInventoryBase):
    id: int
    user_id: str
    product_id: int
    product: ProductOut
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ===============================
# INVENTORY MOVEMENT SCHEMAS
# ===============================

class InventoryMovementBase(BaseModel):
    movement_type: MovementTypeEnum
    quantity_change: float
    unit: Optional[str] = Field(None, max_length=50)
    reason: Optional[str] = Field(None, max_length=500)
    reference_id: Optional[str] = Field(None, max_length=100)
    reference_type: Optional[str] = Field(None, max_length=50)
    cost_per_unit: Optional[confloat(ge=0.0)] = None
    total_cost: Optional[confloat(ge=0.0)] = None
    notes: Optional[str] = None

class InventoryMovementCreate(InventoryMovementBase):
    user_id: str = Field(..., max_length=100)
    product_id: int
    quantity_before: confloat(ge=0.0)
    quantity_after: confloat(ge=0.0)

class InventoryMovementOut(InventoryMovementBase):
    id: int
    user_id: str
    product_id: int
    inventory_item_id: Optional[int]
    quantity_before: float
    quantity_after: float
    created_at: datetime
    created_by: Optional[str]
    product: ProductOut
    
    class Config:
        from_attributes = True

# ===============================
# INVENTORY SUMMARY SCHEMAS
# ===============================

class InventorySummaryByCategory(BaseModel):
    """Resumen de inventario por categoría"""
    category: ProductCategoryEnum
    total_products: int
    total_quantity: float
    low_stock_count: int
    expired_soon_count: int

class UserInventorySummary(BaseModel):
    """Resumen general del inventario del usuario"""
    total_products: int
    total_categories: int
    low_stock_products: int
    expired_soon_products: int
    categories: List[InventorySummaryByCategory]
    last_updated: datetime

# ===============================
# QUICK ADD SCHEMAS
# ===============================

class QuickAddInventoryItem(BaseModel):
    """Schema para agregar productos rápidamente al inventario"""
    product_name: str = Field(..., min_length=1, max_length=255)
    category: ProductCategoryEnum
    quantity: confloat(gt=0.0)
    unit: Optional[str] = Field("unidades", max_length=50)
    purchase_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    store_purchased: Optional[str] = Field(None, max_length=255)

class BulkAddInventoryItems(BaseModel):
    """Schema para agregar múltiples productos al inventario"""
    user_id: str = Field(..., max_length=100)
    items: List[QuickAddInventoryItem] = Field(..., min_items=1, max_items=50)


# ===============================
# RECIPE SCHEMAS
# ===============================

class DifficultyLevelEnum(str, Enum):
    """Niveles de dificultad de recetas"""
    FACIL = "facil"
    INTERMEDIO = "intermedio"
    DIFICIL = "dificil"

class RecipeIngredientBase(BaseModel):
    product_id: int
    quantity_needed: confloat(gt=0.0)
    unit: str = Field(..., max_length=50)
    is_optional: bool = False
    notes: Optional[str] = Field(None, max_length=255)

class RecipeIngredientCreate(RecipeIngredientBase):
    pass

class RecipeIngredientOut(RecipeIngredientBase):
    id: int
    recipe_id: int
    product: ProductOut
    
    class Config:
        from_attributes = True

class RecipeIngredientWithAvailability(RecipeIngredientOut):
    """Ingrediente con información de disponibilidad en inventario"""
    available_quantity: float
    has_enough: bool
    availability_percentage: float

class RecipeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    difficulty: DifficultyLevelEnum = DifficultyLevelEnum.FACIL
    prep_time_minutes: int = Field(..., ge=1)
    cook_time_minutes: Optional[int] = Field(None, ge=0)
    servings: int = Field(..., ge=1)
    instructions: str = Field(..., min_length=10)
    image_url: Optional[str] = Field(None, max_length=500)
    tags: Optional[str] = Field(None, max_length=500)

class RecipeCreate(RecipeBase):
    ingredients: List[RecipeIngredientCreate] = Field(..., min_items=1)

class RecipeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    difficulty: Optional[DifficultyLevelEnum] = None
    prep_time_minutes: Optional[int] = Field(None, ge=1)
    cook_time_minutes: Optional[int] = Field(None, ge=0)
    servings: Optional[int] = Field(None, ge=1)
    instructions: Optional[str] = Field(None, min_length=10)
    image_url: Optional[str] = Field(None, max_length=500)
    tags: Optional[str] = Field(None, max_length=500)
    ingredients: Optional[List[RecipeIngredientCreate]] = None

class RecipeOut(RecipeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool
    ingredients: List[RecipeIngredientOut]
    
    class Config:
        from_attributes = True

class RecipeWithAvailability(RecipeOut):
    """Receta con información de disponibilidad de ingredientes"""
    availability_percentage: float
    missing_ingredients: List[RecipeIngredientWithAvailability]
    available_ingredients: List[RecipeIngredientWithAvailability]
    can_make: bool

class RecipeListItem(BaseModel):
    """Versión simplificada de receta para listados"""
    id: int
    name: str
    description: Optional[str]
    difficulty: DifficultyLevelEnum
    prep_time_minutes: int
    cook_time_minutes: Optional[int]
    servings: int
    image_url: Optional[str]
    tags: Optional[str]
    availability_percentage: float
    ingredient_count: int
    
    class Config:
        from_attributes = True


