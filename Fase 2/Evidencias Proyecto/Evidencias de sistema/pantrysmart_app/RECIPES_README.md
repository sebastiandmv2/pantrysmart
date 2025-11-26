# Sistema de Recetas - PantrySmart

## 📖 Descripción

El sistema de recetas de PantrySmart permite a los usuarios ver recetas chilenas populares y conocer qué porcentaje de ingredientes tienen disponibles en su inventario.

## 🍽️ Características

### 1. **Recetas Guardadas en Memoria**
- 10 recetas chilenas populares con ingredientes esenciales
- Cada receta incluye:
  - Nombre y descripción
  - Nivel de dificultad (Fácil, Intermedio, Difícil)
  - Tiempo de preparación y cocción
  - Número de porciones
  - Instrucciones paso a paso
  - Lista de ingredientes con cantidades

### 2. **Integración con Inventario**
- **Barra de porcentaje**: Muestra qué porcentaje de ingredientes tienes disponibles
- **Indicadores visuales**: 
  - Verde (≥80%): Tienes casi todos los ingredientes
  - Amarillo (50-79%): Te faltan algunos ingredientes
  - Rojo (<50%): Te faltan muchos ingredientes

### 3. **Pantalla de Detalle**
- **Ingredientes disponibles**: Marcados con ✓ en verde
- **Ingredientes faltantes**: Marcados con ✗ en rojo
- **Cantidad disponible vs necesaria**: Para cada ingrediente
- **Instrucciones completas**: Paso a paso para preparar la receta

## 🚀 Configuración

### 1. Poblar la Base de Datos
```bash
# Desde la raíz del proyecto
./setup_recipes.sh
```

O manualmente:
```bash
cd api
python populate_recipes.py
```

### 2. Iniciar la API
```bash
cd api
# Activar entorno virtual si es necesario
# source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Iniciar la App Móvil
```bash
cd mobile
npm install
npm start
```

## 📱 Uso de la Aplicación

### Pantalla Principal de Recetas
1. **Navegar** a la pestaña "Recetas"
2. **Ver lista** de recetas con porcentaje de disponibilidad
3. **Buscar** recetas usando la barra de búsqueda
4. **Refrescar** tirando hacia abajo

### Detalle de Receta
1. **Tocar** cualquier receta de la lista
2. **Ver disponibilidad** general de ingredientes
3. **Revisar ingredientes**:
   - Sección "Disponibles": Ingredientes que tienes
   - Sección "Faltantes": Ingredientes que necesitas comprar
4. **Leer instrucciones** paso a paso
5. **Botón de acción**: 
   - "Comenzar a cocinar" si tienes todos los ingredientes
   - "Faltan ingredientes" si necesitas más productos

## 🍳 Recetas Incluidas

1. **Empanadas de Pino** - Tradicionales empanadas chilenas
2. **Pastel de Choclo** - Pastel tradicional de verano
3. **Cazuela de Pollo** - Sopa tradicional de invierno
4. **Completo Italiano** - Hot dog con palta, tomate y mayonesa
5. **Porotos con Riendas** - Plato económico con fideos
6. **Arroz con Pollo** - Plato familiar nutritivo
7. **Charquicán** - Guiso tradicional con verduras
8. **Sopaipillas** - Masa frita para días lluviosos
9. **Lomo a lo Pobre** - Plato contundente con huevo frito
10. **Pan Amasado** - Pan casero tradicional

## 🔧 API Endpoints

### Obtener Recetas
```
GET /recipes/?user_id={user_id}&search={term}&difficulty={level}
```

### Detalle de Receta
```
GET /recipes/{recipe_id}?user_id={user_id}
```

### Crear Receta
```
POST /recipes/
```

### Actualizar Receta
```
PUT /recipes/{recipe_id}
```

### Eliminar Receta
```
DELETE /recipes/{recipe_id}
```

## 📊 Cálculo de Disponibilidad

El sistema calcula la disponibilidad de la siguiente manera:

1. **Por ingrediente**: `(cantidad_disponible / cantidad_necesaria) * 100`
2. **Por receta**: `(ingredientes_disponibles / total_ingredientes_no_opcionales) * 100`
3. **Estado "Puede hacer"**: Todos los ingredientes no opcionales están disponibles

## 🎨 Interfaz de Usuario

### Colores de Disponibilidad
- **Verde (#10b981)**: ≥80% disponible
- **Amarillo (#f59e0b)**: 50-79% disponible  
- **Rojo (#ef4444)**: <50% disponible

### Niveles de Dificultad
- **Fácil**: Verde - Recetas simples y rápidas
- **Intermedio**: Amarillo - Requieren más tiempo o técnica
- **Difícil**: Rojo - Recetas complejas o largas

## 🔄 Integración con Inventario

El sistema se integra automáticamente con el inventario del usuario:
- **Consulta en tiempo real** la disponibilidad de productos
- **Actualiza automáticamente** cuando se agregan/consumen productos
- **Considera unidades** para cálculos precisos (gramos, litros, unidades)

## 📝 Próximas Funcionalidades

- [ ] Marcar recetas como favoritas
- [ ] Consumir ingredientes automáticamente al cocinar
- [ ] Sugerir recetas basadas en inventario disponible
- [ ] Agregar fotos a las recetas
- [ ] Sistema de calificaciones y comentarios
- [ ] Crear recetas personalizadas
- [ ] Lista de compras automática para ingredientes faltantes

## 🐛 Solución de Problemas

### Error: "No se encontraron recetas"
- Verificar que la API esté ejecutándose
- Ejecutar el script de población: `./setup_recipes.sh`
- Revisar la configuración de la URL de la API

### Error: "Disponibilidad no se actualiza"
- Verificar que el user_id sea correcto
- Asegurarse de que hay productos en el inventario
- Refrescar la pantalla tirando hacia abajo

### Error: "No se puede cargar detalle"
- Verificar conexión a internet
- Comprobar que la receta existe en la base de datos
- Revisar logs de la API para errores

## 📞 Soporte

Para problemas o sugerencias relacionadas con el sistema de recetas, revisar:
1. Logs de la API en la terminal
2. Logs del frontend en la consola del navegador/dispositivo
3. Estado de la base de datos con las recetas pobladas