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
# USER INVENTORY SCHEMAS - SIMPLIFICADO
# ===============================

class UserInventoryBase(BaseModel):
    current_quantity: conint(ge=0)  # SOLO ENTEROS
    # unit eliminado - siempre "unidades"
    stock_level: StockLevelEnum = StockLevelEnum.MEDIO
    # Campos simplificados eliminados para POC
    store_purchased: Optional[str] = Field(None, max_length=255)
    min_stock_alert: Optional[conint(ge=0)] = 1
    auto_consume: bool = True

class UserInventoryCreate(UserInventoryBase):
    product_id: int
    user_id: str = Field(..., max_length=100)

class UserInventoryUpdate(BaseModel):
    current_quantity: Optional[conint(ge=0)] = None  # SOLO ENTEROS
    # unit eliminado - siempre "unidades"
    stock_level: Optional[StockLevelEnum] = None
    # Campos simplificados eliminados para POC
    store_purchased: Optional[str] = Field(None, max_length=255)
    min_stock_alert: Optional[conint(ge=0)] = None
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
    quantity_change: int  # SOLO ENTEROS
    # unit eliminado - siempre "unidades"
    reason: Optional[str] = Field(None, max_length=500)
    reference_id: Optional[str] = Field(None, max_length=100)
    reference_type: Optional[str] = Field(None, max_length=50)
    # Costos eliminados para POC
    notes: Optional[str] = None

class InventoryMovementCreate(InventoryMovementBase):
    user_id: str = Field(..., max_length=100)
    product_id: int
    quantity_before: conint(ge=0)  # SOLO ENTEROS
    quantity_after: conint(ge=0)   # SOLO ENTEROS

class InventoryMovementOut(InventoryMovementBase):
    id: int
    user_id: str
    product_id: int
    inventory_item_id: Optional[int]
    quantity_before: int  # SOLO ENTEROS
    quantity_after: int   # SOLO ENTEROS
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
# QUICK ADD SCHEMAS - SIMPLIFICADO
# ===============================

class QuickAddInventoryItem(BaseModel):
    """Schema para agregar productos rápidamente al inventario - SIMPLIFICADO"""
    product_name: str = Field(..., min_length=1, max_length=255)
    category: ProductCategoryEnum
    quantity: conint(gt=0)  # SOLO ENTEROS POSITIVOS
    # unit eliminado - siempre "unidades"
    # Fechas eliminadas para POC
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
    quantity_needed: conint(gt=0)  # SOLO ENTEROS POSITIVOS
    # unit eliminado - siempre "unidades"
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
    available_quantity: int  # SOLO ENTEROS
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


# ===============================
# AI RECIPE GENERATION SCHEMAS
# ===============================

class TimePreferenceEnum(str, Enum):
    """Preferencias de tiempo de preparación"""
    QUICK = "15"  # ≤15 min
    MEDIUM = "30"  # ≤30 min
    LONG = "60"    # ≤60 min

class CuisineTypeEnum(str, Enum):
    """Tipos de cocina"""
    MEDITERRANEO = "mediterraneo"
    CHILENO = "chileno"
    ASIATICO = "asiatico"
    VEGANO = "vegano"
    VEGETARIANO = "vegetariano"
    SIN_GLUTEN = "sin_gluten"

class EquipmentEnum(str, Enum):
    """Equipos de cocina disponibles"""
    HORNO = "horno"
    SARTEN = "sarten"
    OLLA = "olla"
    MICROONDAS = "microondas"
    PARRILLA = "parrilla"
    OLLA_PRESION = "olla_presion"

class BudgetEnum(str, Enum):
    """Niveles de presupuesto"""
    BAJO = "bajo"
    MEDIO = "medio"
    LIBRE = "libre"

class AIRecipeRequest(BaseModel):
    """Request para generar recetas con IA"""
    user_id: str = Field(..., max_length=100)
    max_time_minutes: TimePreferenceEnum
    servings: int = Field(..., ge=1, le=8)
    difficulty: DifficultyLevelEnum
    cuisine_types: List[CuisineTypeEnum] = Field(..., min_items=1)
    available_equipment: List[EquipmentEnum] = Field(..., min_items=1)
    budget: BudgetEnum
    maximize_pantry_use: bool = True

class GeneratedRecipeIngredient(BaseModel):
    """Ingrediente de receta generada por IA"""
    name: str
    quantity: int
    unit: str = "unidades"
    is_optional: bool = False
    notes: Optional[str] = None

class GeneratedRecipe(BaseModel):
    """Receta generada por IA (antes de guardar)"""
    name: str
    description: str
    difficulty: DifficultyLevelEnum
    prep_time_minutes: int
    cook_time_minutes: Optional[int]
    servings: int
    instructions: str
    tags: str
    ingredients: List[GeneratedRecipeIngredient]
    # Campos calculados
    availability_percentage: Optional[float] = None
    missing_ingredients: Optional[List[str]] = None
    can_make: Optional[bool] = None

class AIRecipeResponse(BaseModel):
    """Respuesta con 3 recetas generadas por IA"""
    recipes: List[GeneratedRecipe] = Field(..., min_items=3, max_items=3)
    generation_time_seconds: float
    user_inventory_items: int  # Cantidad de productos en inventario del usuario
    prompt_used: Optional[str] = None  # Para debug

class SaveGeneratedRecipeRequest(BaseModel):
    """Request para guardar una receta generada"""
    user_id: str = Field(..., max_length=100)
    recipe: GeneratedRecipe


# ===============================
# SHOPPING LIST SCHEMAS
# ===============================

class ShoppingListItemStatusEnum(str, Enum):
    """Estados de items en lista de compras"""
    PENDING = "pending"
    PURCHASED = "purchased"
    CANCELLED = "cancelled"

class ShoppingListItemPriorityEnum(int, Enum):
    """Prioridades de items en lista de compras"""
    HIGH = 1
    MEDIUM = 2
    LOW = 3

class ShoppingListItemBase(BaseModel):
    quantity_needed: int = Field(..., gt=0)
    unit: str = Field(default="unidades", max_length=50)
    notes: Optional[str] = Field(None, max_length=500)
    priority: ShoppingListItemPriorityEnum = ShoppingListItemPriorityEnum.MEDIUM
    estimated_price: Optional[float] = Field(None, ge=0)
    store_to_buy: Optional[str] = Field(None, max_length=255)

class ShoppingListItemCreate(ShoppingListItemBase):
    user_id: str = Field(..., max_length=100)
    product_id: int
    added_from_recipe_id: Optional[int] = None
    added_from_recipe_name: Optional[str] = Field(None, max_length=255)

class ShoppingListItemUpdate(BaseModel):
    quantity_needed: Optional[int] = Field(None, gt=0)
    status: Optional[ShoppingListItemStatusEnum] = None
    notes: Optional[str] = Field(None, max_length=500)
    priority: Optional[ShoppingListItemPriorityEnum] = None
    estimated_price: Optional[float] = Field(None, ge=0)
    actual_price: Optional[float] = Field(None, ge=0)
    store_to_buy: Optional[str] = Field(None, max_length=255)

class ShoppingListItemOut(ShoppingListItemBase):
    id: int
    user_id: str
    product_id: int
    product: ProductOut
    status: ShoppingListItemStatusEnum
    added_from_recipe_id: Optional[int]
    added_from_recipe_name: Optional[str]
    actual_price: Optional[float]
    purchased_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AddToShoppingListRequest(BaseModel):
    """Request para agregar ingredientes faltantes a lista de compras"""
    user_id: str = Field(..., max_length=100)
    ingredient_names: List[str] = Field(..., min_items=1)
    recipe_id: Optional[int] = None
    recipe_name: Optional[str] = Field(None, max_length=255)
    priority: ShoppingListItemPriorityEnum = ShoppingListItemPriorityEnum.MEDIUM

class BulkAddToShoppingListRequest(BaseModel):
    """Request para agregar múltiples items a lista de compras"""
    user_id: str = Field(..., max_length=100)
    items: List[ShoppingListItemCreate] = Field(..., min_items=1, max_items=50)

class ShoppingListSummary(BaseModel):
    """Resumen de la lista de compras"""
    total_items: int
    pending_items: int
    purchased_items: int
    cancelled_items: int
    estimated_total_cost: float
    actual_total_cost: float
    items_by_category: dict  # Cantidad de items por categoría


