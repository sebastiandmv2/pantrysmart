# 📦 Setup de Sistema de Inventario

Este documento explica cómo configurar el nuevo sistema de inventario en PantrySmart.

## 🎯 Objetivo

Implementar un sistema completo de inventario personal que permita:
- Catálogo de productos con categorías
- Inventario personal por usuario
- Historial de movimientos de inventario
- Integración con escaneo de boletas

## 📋 Componentes Agregados

### 1. **Modelos de Base de Datos** (`models.py`)
- `Product`: Catálogo general de productos
- `UserInventory`: Inventario personal de cada usuario
- `InventoryMovement`: Historial de cambios en inventario

### 2. **Schemas Pydantic** (`schemas.py`)
- Schemas de entrada y salida para todos los modelos
- Validaciones y tipos de datos
- Enums para categorías y estados

### 3. **Configuración** (`inventory_config.py`)
- Configuración de categorías con iconos y colores
- Reglas de negocio para niveles de stock
- Utilidades para frontend

### 4. **Utilidades** (`inventory_utils.py`)
- Funciones helper para operaciones comunes
- Integración con sistema de boletas
- Cálculo de niveles de stock

## 🚀 Instrucciones de Setup

### Paso 1: Verificar Configuración
```bash
# Asegurarse de que DATABASE_URL está configurado en .env
echo $DATABASE_URL
```

### Paso 2: Crear Tablas
```bash
cd pantrysmart_app/api
python create_inventory_tables.py
```

Este script:
- ✅ Crea las nuevas tablas de inventario
- ✅ Puebla el catálogo inicial con productos básicos
- ✅ Verifica que todo se creó correctamente

### Paso 3: Verificar Setup
```bash
python verify_inventory_setup.py
```

Este script verifica:
- ✅ Conexión a base de datos
- ✅ Existencia de tablas
- ✅ Importación de modelos y schemas
- ✅ Datos de muestra

### Paso 4: Reiniciar Servidor
```bash
# Reiniciar el servidor API para cargar los nuevos modelos
docker-compose restart api
```

## 📊 Estructura de Datos

### Product (Catálogo de Productos)
```sql
- id: Integer (PK)
- name: String (255) - Nombre del producto
- category: Enum - Categoría del producto
- description: Text - Descripción
- default_unit: String - Unidad por defecto
- barcode: String - Código de barras
- is_perishable: Boolean - Si es perecedero
- typical_shelf_life_days: Integer - Vida útil típica
- created_at, updated_at: DateTime
```

### UserInventory (Inventario Personal)
```sql
- id: Integer (PK)
- user_id: String - ID del usuario
- product_id: Integer (FK) - Referencia a Product
- current_quantity: Float - Cantidad actual
- unit: String - Unidad de medida
- stock_level: Enum - Nivel de stock (alto/medio/bajo/agotado)
- purchase_date: DateTime - Fecha de compra
- expiration_date: DateTime - Fecha de vencimiento
- purchase_price: Float - Precio de compra
- store_purchased: String - Tienda donde se compró
- min_stock_alert: Float - Cantidad mínima para alerta
- auto_consume: Boolean - Si se consume automáticamente
- created_at, updated_at: DateTime
```

### InventoryMovement (Historial)
```sql
- id: Integer (PK)
- user_id: String - ID del usuario
- product_id: Integer (FK) - Referencia a Product
- inventory_item_id: Integer (FK) - Referencia a UserInventory
- movement_type: Enum - Tipo de movimiento
- quantity_change: Float - Cambio en cantidad (+/-)
- quantity_before: Float - Cantidad antes
- quantity_after: Float - Cantidad después
- unit: String - Unidad
- reason: String - Razón del movimiento
- reference_id: String - ID de referencia (boleta, receta, etc.)
- reference_type: String - Tipo de referencia
- cost_per_unit: Float - Costo por unidad
- total_cost: Float - Costo total
- notes: Text - Notas adicionales
- created_at: DateTime
- created_by: String - Usuario que hizo el movimiento
```

## 🏷️ Categorías de Productos

### Alimentos (is_food: true)
- **Abarrotes**: Arroz, fideos, azúcar, harina, etc.
- **Lácteos**: Leche, queso, yogur, mantequilla
- **Carnes**: Pollo, carne molida, atún
- **Embutidos**: Jamón, salchichas, etc.
- **Panadería**: Pan, galletas, etc.
- **Verduras**: Cebolla, tomate, ajo, zanahoria
- **Frutas**: Manzana, plátano, berries
- **Congelados**: Helado, comida congelada
- **Dulces**: Chocolates, caramelos
- **Snacks**: Papas fritas, galletas
- **Condimentos**: Aceite, sal, especias

### No Alimentos (is_food: false)
- **Bebestibles**: Bebidas, jugos, agua
- **Limpieza**: Detergente, cloro, etc.
- **Cuidado Personal**: Shampoo, jabón, etc.
- **Mascotas**: Comida para mascotas
- **Hogar**: Artículos del hogar

## 📈 Niveles de Stock

- **ALTO**: Stock suficiente (verde)
- **MEDIO**: Stock moderado (amarillo)
- **BAJO**: Stock bajo - considerar comprar (naranja)
- **AGOTADO**: Sin stock - comprar urgente (rojo)

## 🔄 Tipos de Movimiento

- **ADDED_RECEIPT**: Agregado desde boleta escaneada
- **ADDED_MANUAL**: Agregado manualmente por usuario
- **CONSUMED**: Consumido (receta, uso personal)
- **EXPIRED**: Vencido/descartado
- **ADJUSTED**: Ajuste manual de inventario
- **REMOVED**: Eliminado del inventario

## 🧪 Testing

### Verificar que las tablas se crearon:
```sql
SHOW TABLES LIKE '%inventory%';
SHOW TABLES LIKE 'products';
```

### Verificar datos iniciales:
```sql
SELECT COUNT(*) FROM products;
SELECT name, category FROM products LIMIT 10;
```

### Crear un item de inventario de prueba:
```python
from app.inventory_utils import add_to_inventory
from app.models import ProductCategory

# Agregar arroz al inventario del usuario demo
inventory_item, movement = add_to_inventory(
    db=db,
    user_id="demo-user",
    product_name="Arroz integral",
    category=ProductCategory.ABARROTES,
    quantity=2.0,
    unit="kg"
)
```

## 🔧 Troubleshooting

### Error: "Table doesn't exist"
```bash
# Ejecutar creación de tablas
python create_inventory_tables.py
```

### Error: "Cannot import models"
```bash
# Verificar que el PYTHONPATH incluye el directorio de la app
export PYTHONPATH="${PYTHONPATH}:/path/to/pantrysmart_app/api"
```

### Error: "DATABASE_URL not defined"
```bash
# Verificar archivo .env
cat .env | grep DATABASE_URL
```

## 📝 Próximos Pasos

1. ✅ **Completado**: Modelos y configuración base
2. 🔄 **Siguiente**: Crear endpoints de API para inventario
3. 🔄 **Siguiente**: Integrar con frontend móvil
4. 🔄 **Siguiente**: Conectar con flujo de boletas existente

## 📚 Referencias

- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://pydantic-docs.helpmanual.io/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)