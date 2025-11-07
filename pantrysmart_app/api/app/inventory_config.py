"""
Configuración del sistema de inventario
Define categorías, iconos, colores y reglas de negocio
"""

from app.models import ProductCategory, StockLevel
from typing import Dict, List, Optional

# ===============================
# CONFIGURACIÓN DE CATEGORÍAS
# ===============================

CATEGORY_CONFIG = {
    ProductCategory.ABARROTES: {
        "name": "Abarrotes",
        "icon": "package-variant-closed",
        "color": "#059669",
        "color_light": "#ecfdf5",
        "is_food": True,
        "typical_shelf_life": 365,  # días
        "default_unit": "kg",
        "priority": 1
    },
    ProductCategory.LACTEOS: {
        "name": "Lácteos", 
        "icon": "bottle-soda",
        "color": "#0ea5e9",
        "color_light": "#e0f2fe",
        "is_food": True,
        "typical_shelf_life": 7,
        "default_unit": "litros",
        "priority": 2
    },
    ProductCategory.CARNES: {
        "name": "Carnes",
        "icon": "food-drumstick",
        "color": "#dc2626",
        "color_light": "#fee2e2",
        "is_food": True,
        "typical_shelf_life": 3,
        "default_unit": "kg",
        "priority": 3
    },
    ProductCategory.EMBUTIDOS: {
        "name": "Embutidos",
        "icon": "sausage",
        "color": "#b91c1c",
        "color_light": "#fef2f2",
        "is_food": True,
        "typical_shelf_life": 14,
        "default_unit": "kg",
        "priority": 4
    },
    ProductCategory.PANADERIA: {
        "name": "Panadería",
        "icon": "bread-slice",
        "color": "#d97706",
        "color_light": "#fef3c7",
        "is_food": True,
        "typical_shelf_life": 2,
        "default_unit": "unidades",
        "priority": 5
    },
    ProductCategory.VERDURAS: {
        "name": "Verduras",
        "icon": "sprout",
        "color": "#16a34a",
        "color_light": "#dcfce7",
        "is_food": True,
        "typical_shelf_life": 5,
        "default_unit": "kg",
        "priority": 6
    },
    ProductCategory.FRUTAS: {
        "name": "Frutas",
        "icon": "apple",
        "color": "#10b981",
        "color_light": "#d1fae5",
        "is_food": True,
        "typical_shelf_life": 7,
        "default_unit": "kg",
        "priority": 7
    },
    ProductCategory.CONGELADOS: {
        "name": "Congelados",
        "icon": "snowflake",
        "color": "#06b6d4",
        "color_light": "#cffafe",
        "is_food": True,
        "typical_shelf_life": 90,
        "default_unit": "kg",
        "priority": 8
    },
    ProductCategory.DULCES: {
        "name": "Dulces",
        "icon": "candy",
        "color": "#ec4899",
        "color_light": "#fce7f3",
        "is_food": True,
        "typical_shelf_life": 180,
        "default_unit": "unidades",
        "priority": 9
    },
    ProductCategory.SNACKS: {
        "name": "Snacks",
        "icon": "popcorn",
        "color": "#f59e0b",
        "color_light": "#fef3c7",
        "is_food": True,
        "typical_shelf_life": 120,
        "default_unit": "unidades",
        "priority": 10
    },
    ProductCategory.CONDIMENTOS: {
        "name": "Condimentos",
        "icon": "shaker-outline",
        "color": "#8b5cf6",
        "color_light": "#f3e8ff",
        "is_food": True,
        "typical_shelf_life": 365,
        "default_unit": "ml",
        "priority": 11
    },
    ProductCategory.BEBESTIBLES: {
        "name": "Bebestibles",
        "icon": "cup-water",
        "color": "#06b6d4",
        "color_light": "#cffafe",
        "is_food": False,
        "typical_shelf_life": 365,
        "default_unit": "litros",
        "priority": 12
    },
    ProductCategory.LIMPIEZA: {
        "name": "Limpieza",
        "icon": "spray-bottle",
        "color": "#6b7280",
        "color_light": "#f9fafb",
        "is_food": False,
        "typical_shelf_life": None,
        "default_unit": "ml",
        "priority": 13
    },
    ProductCategory.CUIDADO_PERSONAL: {
        "name": "Cuidado Personal",
        "icon": "face-woman",
        "color": "#9ca3af",
        "color_light": "#f3f4f6",
        "is_food": False,
        "typical_shelf_life": None,
        "default_unit": "ml",
        "priority": 14
    },
    ProductCategory.MASCOTAS: {
        "name": "Mascotas",
        "icon": "dog",
        "color": "#84cc16",
        "color_light": "#f7fee7",
        "is_food": False,
        "typical_shelf_life": 365,
        "default_unit": "kg",
        "priority": 15
    },
    ProductCategory.HOGAR: {
        "name": "Hogar",
        "icon": "home-variant",
        "color": "#64748b",
        "color_light": "#f1f5f9",
        "is_food": False,
        "typical_shelf_life": None,
        "default_unit": "unidades",
        "priority": 16
    }
}

# ===============================
# CONFIGURACIÓN DE STOCK LEVELS
# ===============================

STOCK_LEVEL_CONFIG = {
    StockLevel.ALTO: {
        "name": "Alto",
        "color": "#059669",
        "color_light": "#dcfce7",
        "icon": "arrow-up-circle",
        "description": "Stock suficiente"
    },
    StockLevel.MEDIO: {
        "name": "Medio", 
        "color": "#d97706",
        "color_light": "#fef3c7",
        "icon": "minus-circle",
        "description": "Stock moderado"
    },
    StockLevel.BAJO: {
        "name": "Bajo",
        "color": "#dc2626", 
        "color_light": "#fee2e2",
        "icon": "arrow-down-circle",
        "description": "Stock bajo - considerar comprar"
    },
    StockLevel.AGOTADO: {
        "name": "Agotado",
        "color": "#991b1b",
        "color_light": "#fef2f2", 
        "icon": "close-circle",
        "description": "Sin stock - comprar urgente"
    }
}

# ===============================
# REGLAS DE NEGOCIO
# ===============================

def get_stock_level(current_quantity: float, min_alert: float = 1.0) -> StockLevel:
    """Determina el nivel de stock basado en la cantidad actual"""
    if current_quantity <= 0:
        return StockLevel.AGOTADO
    elif current_quantity <= min_alert:
        return StockLevel.BAJO
    elif current_quantity <= min_alert * 2:
        return StockLevel.MEDIO
    else:
        return StockLevel.ALTO

def get_food_categories() -> List[ProductCategory]:
    """Retorna las categorías que son alimentos"""
    return [cat for cat, config in CATEGORY_CONFIG.items() if config["is_food"]]

def get_non_food_categories() -> List[ProductCategory]:
    """Retorna las categorías que NO son alimentos"""
    return [cat for cat, config in CATEGORY_CONFIG.items() if not config["is_food"]]

def get_category_config(category: ProductCategory) -> Dict:
    """Obtiene la configuración de una categoría específica"""
    return CATEGORY_CONFIG.get(category, {})

def get_categories_sorted_by_priority() -> List[ProductCategory]:
    """Retorna las categorías ordenadas por prioridad"""
    return sorted(CATEGORY_CONFIG.keys(), key=lambda cat: CATEGORY_CONFIG[cat]["priority"])

def is_perishable_category(category: ProductCategory) -> bool:
    """Determina si una categoría es típicamente perecedera"""
    perishable_categories = [
        ProductCategory.LACTEOS,
        ProductCategory.CARNES, 
        ProductCategory.EMBUTIDOS,
        ProductCategory.PANADERIA,
        ProductCategory.VERDURAS,
        ProductCategory.FRUTAS
    ]
    return category in perishable_categories

def get_default_shelf_life(category: ProductCategory) -> Optional[int]:
    """Obtiene la vida útil típica en días para una categoría"""
    config = CATEGORY_CONFIG.get(category, {})
    return config.get("typical_shelf_life")

def get_default_unit(category: ProductCategory) -> str:
    """Obtiene la unidad por defecto para una categoría"""
    config = CATEGORY_CONFIG.get(category, {})
    return config.get("default_unit", "unidades")

# ===============================
# UTILIDADES PARA FRONTEND
# ===============================

def get_categories_for_frontend() -> List[Dict]:
    """Retorna las categorías formateadas para el frontend"""
    categories = []
    for category in get_categories_sorted_by_priority():
        config = CATEGORY_CONFIG[category]
        categories.append({
            "id": category.value,
            "name": config["name"],
            "icon": config["icon"],
            "color": config["color"],
            "color_light": config["color_light"],
            "is_food": config["is_food"],
            "default_unit": config["default_unit"]
        })
    return categories

def get_stock_levels_for_frontend() -> List[Dict]:
    """Retorna los niveles de stock formateados para el frontend"""
    levels = []
    for level, config in STOCK_LEVEL_CONFIG.items():
        levels.append({
            "id": level.value,
            "name": config["name"],
            "color": config["color"],
            "color_light": config["color_light"],
            "icon": config["icon"],
            "description": config["description"]
        })
    return levels