# 🏠 HomeScreen - Integración con Inventario Real

Este documento describe la integración del HomeScreen con el sistema de inventario real, reemplazando los datos mock con información dinámica de la base de datos.

## 🎯 Objetivo

Transformar el HomeScreen de un prototipo con datos estáticos a una pantalla funcional que muestre información real del inventario del usuario.

## 📊 Cambios Implementados

### 1. **Hook de Inventario (`useInventory.js`)**
- ✅ Hook personalizado para manejar datos de inventario
- ✅ Carga automática de resumen, categorías, productos recientes
- ✅ Gestión de estados de loading y error
- ✅ Función de refresh para actualizar datos

### 2. **Servicios de API Actualizados (`apiService.js`)**
- ✅ Endpoints completos de inventario agregados
- ✅ Funciones para obtener resumen, items, categorías
- ✅ Soporte para filtros y paginación
- ✅ Endpoints demo para testing

### 3. **HomeScreen Rediseñado**
- ✅ Reemplazó datos mock con datos reales
- ✅ Estados de loading y error manejados
- ✅ Pull-to-refresh implementado
- ✅ Navegación a pantalla de agregar producto

### 4. **Pantalla Agregar Producto (`AddProductScreen.js`)**
- ✅ Formulario completo para agregar productos manualmente
- ✅ Selector de categorías con iconos y colores
- ✅ Validaciones de formulario
- ✅ Integración con API de inventario

## 🔄 Flujo de Datos

```
📱 Usuario abre HomeScreen
    ↓
🔄 useInventory hook se ejecuta
    ↓
📡 Llama a múltiples endpoints:
    - /inventory/user/{id}/summary
    - /inventory/products/categories  
    - /inventory/user/{id}/items
    - /inventory/user/{id}/low-stock
    ↓
📊 Procesa y formatea datos
    ↓
🎨 Renderiza UI con datos reales
    ↓
🔄 Refresh automático al obtener foco
```

## 📱 Secciones Actualizadas

### **1. Encabezado**
- **Antes:** "Tienes 24 productos en tu despensa" (hardcoded)
- **Ahora:** "Tienes {totalProducts} producto(s) en tu despensa" (dinámico)
- **Loading:** Muestra spinner mientras carga

### **2. KPIs**
- **Antes:** "3 productos faltantes" y "Ahorro semanal $12.450" (mock)
- **Ahora:** "Stock bajo: {count}" y "Categorías: {count}" (real)

### **3. Productos con Stock Bajo**
- **Antes:** Lista hardcodeada ["Leche 0L / 1L", "Huevos 0 / 12", ...]
- **Ahora:** Productos reales con stock bajo del inventario
- **Formato:** "{nombre} {cantidadActual}{unidad} / {mínimo}{unidad}"
- **Estado vacío:** "¡Todos los productos tienen stock suficiente!"

### **4. Inventario por Categoría**
- **Antes:** 5 categorías hardcodeadas con conteos fake
- **Ahora:** Categorías dinámicas con conteos reales
- **Iconos:** Usa iconos de la configuración de categorías
- **Colores:** Usa colores específicos por categoría
- **Estado vacío:** "No hay productos en el inventario" + botón para escanear

### **5. Productos Recientes**
- **Antes:** 4 productos hardcodeados con datos fake
- **Ahora:** Últimos 5 productos agregados/actualizados
- **Información:** Cantidad real, unidad, tiempo desde última actualización
- **Niveles:** Stock real (alto/medio/bajo/agotado)
- **Estado vacío:** "No hay productos recientes"

## 🎨 Estados de UI

### **Loading States**
```jsx
{inventoryLoading ? (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="small" color="#2f7d36" />
    <Text style={styles.loadingText}>Cargando inventario...</Text>
  </View>
) : (
  // Contenido real
)}
```

### **Empty States**
```jsx
<View style={styles.emptyState}>
  <MaterialCommunityIcons name="package-variant" size={32} color="#9ca3af" />
  <Text style={styles.emptyText}>No hay productos en el inventario</Text>
  <TouchableOpacity 
    style={styles.addFirstProductBtn}
    onPress={() => navigation.navigate("Scan")}
  >
    <Text style={styles.addFirstProductText}>Escanear primera boleta</Text>
  </TouchableOpacity>
</View>
```

### **Pull to Refresh**
```jsx
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={["#2f7d36"]}
      tintColor="#2f7d36"
    />
  }
>
```

## 🔧 Funcionalidades Nuevas

### **1. Refresh Automático**
- Se actualiza cuando la pantalla obtiene foco
- Pull-to-refresh manual disponible
- Útil después de escanear boletas o agregar productos

### **2. Navegación Mejorada**
- Botón "Añadir producto" → `AddProductScreen`
- Categorías clickeables (preparado para navegación futura)
- Productos recientes con acciones rápidas

### **3. Agregar Producto Manual**
- Formulario completo con validaciones
- Selector de categorías visual
- Campos: nombre, categoría, cantidad, unidad, tienda
- Confirmación de éxito con opciones

## 🧪 Testing

### **Ejecutar Tests**
```bash
cd pantrysmart_app/api
python test_homescreen_integration.py
```

### **Verificaciones del Test**
- ✅ Health check de API
- ✅ Datos de muestra agregados
- ✅ Resumen de inventario
- ✅ Categorías con conteos
- ✅ Productos recientes
- ✅ Productos con stock bajo
- ✅ Agregar producto manual

### **Agregar Datos Demo**
```bash
curl -X POST http://localhost:8000/inventory/demo/add-sample-data
```

## 📝 Configuración Requerida

### **1. Variables de Entorno**
```bash
# En mobile/config.js
API_URL=http://localhost:8000  # URL del servidor API
```

### **2. Dependencias**
```bash
# Ya incluidas en el proyecto
@react-navigation/native
@react-navigation/native-stack
```

### **3. Servidor API**
```bash
# Asegurar que el servidor esté corriendo
docker-compose up api
```

## 🔄 Integración con Boletas

El HomeScreen se actualiza automáticamente cuando:
1. **Se escanea una boleta** → Los productos se agregan al inventario
2. **Se confirma una boleta** → Los conteos se actualizan
3. **Se agrega un producto manual** → Las categorías se refrescan
4. **La pantalla obtiene foco** → Los datos se recargan

## 🎯 Próximos Pasos

1. **✅ Completado:** HomeScreen con datos reales
2. **🔄 Siguiente:** Pantalla de categoría específica
3. **🔄 Siguiente:** Acciones rápidas en productos recientes
4. **🔄 Siguiente:** Notificaciones de stock bajo
5. **🔄 Siguiente:** Métricas de ahorro y gastos

## 🐛 Troubleshooting

### **HomeScreen no carga datos**
```bash
# Verificar que el servidor API esté corriendo
curl http://localhost:8000/health

# Agregar datos de muestra
curl -X POST http://localhost:8000/inventory/demo/add-sample-data
```

### **Error de conexión**
```bash
# Verificar URL en config.js
# Verificar que el dispositivo/emulador puede acceder al servidor
```

### **Datos no se actualizan**
```bash
# Hacer pull-to-refresh en la app
# Verificar logs de la consola del dispositivo
```

## 📚 Referencias

- [useInventory Hook](../mobile/src/hooks/useInventory.js)
- [HomeScreen Component](../mobile/src/screens/HomeScreen.js)
- [AddProduct Screen](../mobile/src/screens/AddProductScreen.js)
- [API Service](../mobile/src/services/apiService.js)
- [Inventory API Endpoints](../api/app/routers/inventory.py)