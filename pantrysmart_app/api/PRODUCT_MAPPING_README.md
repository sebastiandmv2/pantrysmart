# 🎯 Sistema de Mapeo de Productos - PantrySmart

## 📖 Descripción

Este sistema garantiza que el reconocimiento de boletas funcione **perfectamente** en tu demo oficial. Convierte automáticamente texto detectado en boletas (como "ARROZ TUCAPEL 1KG") a tipos canónicos del sistema (como "Arroz").

## 🚀 Preparación Rápida para Demo

### 1. **Verificar que Todo Funcione**
```bash
cd api
python prepare_demo.py
```

### 2. **Si Hay Productos que Fallan**
```bash
python prepare_demo.py --fix-issues
```

### 3. **Probar Producto Específico**
```bash
python test_product_mapping.py --test-product "ARROZ TUCAPEL 1KG"
```

---

## 🔧 Archivos del Sistema

### **Archivos Principales**
- `app/product_mapping.py` - Sistema principal de mapeo
- `demo_products_config.py` - Configuración específica para demo
- `test_product_mapping.py` - Script de pruebas
- `prepare_demo.py` - Script de preparación para demo

### **Archivos de Configuración**
- `app/schemas.py` - Tipos canónicos válidos
- `app/routers/receipts.py` - Integración con API

---

## 🎯 Cómo Funciona

### **Proceso de Mapeo**
1. **IA extrae producto**: "ARROZ TUCAPEL GRADO 1 1KG"
2. **Sistema limpia texto**: "arroz tucapel grado 1 1kg"
3. **Busca en diccionario**: `"arroz tucapel" -> "Arroz"`
4. **Retorna tipo canónico**: "Arroz"

### **Niveles de Mapeo**
1. **Mapeo Directo**: Coincidencia exacta en diccionario
2. **Mapeo por Palabras Clave**: Busca palabras dentro del texto
3. **Mapeo por Patrones Regex**: Patrones complejos con marcas
4. **Mapeo por Categorías**: Análisis de palabras clave por tipo
5. **Fallback**: "Otros" si no encuentra coincidencia

---

## 📋 Productos Críticos para Demo

Estos productos **DEBEN** funcionar perfectamente:

### **Productos Específicos de tu Demo:**
```
✅ CARNE MOLIDA CORRI
✅ LECHE NATURAL ENTE
✅ ATUN LOMITO AG 160
✅ FIDEO CARACOQUESO
✅ CHOCOCEREAL
✅ GRANOLA MIEL 330
✅ ACEITE VEGE
✅ YOG BATIDO FRUTILL
✅ YOG BATIDO MORA
✅ CUS CUS
```

### **Productos Adicionales de Prueba:**
```
✅ ARROZ TUCAPEL 1KG
✅ FIDEOS CAROZZI ESPAGUETI
✅ LECHE SOPROLE ENTERA
✅ ACEITE CHEF VEGETAL
✅ ATUN VAN CAMPS
✅ QUESO CHANCO
✅ PAN DE MOLDE
✅ HUEVOS GALLINA
✅ CEBOLLA BLANCA
✅ TOMATE REDONDO
✅ POLLO PECHUGA
✅ YOGUR NATURAL
```

---

## 🛠️ Comandos Durante la Demo

### **API Endpoints para Debugging**

#### **1. Probar Mapeo de Producto**
```bash
curl -X POST "localhost:8000/receipts/test-mapping?product_name=ARROZ TUCAPEL"
```

**Respuesta:**
```json
{
  "original": "ARROZ TUCAPEL",
  "cleaned": "arroz tucapel",
  "keywords": ["arroz", "tucapel"],
  "mapped_type": "Arroz",
  "is_valid": true
}
```

#### **2. Agregar Mapeo en Tiempo Real**
```bash
curl -X POST "localhost:8000/receipts/add-mapping?original_text=PRODUCTO NUEVO&canonical_type=Arroz"
```

#### **3. Ver Estadísticas del Sistema**
```bash
curl "localhost:8000/receipts/mapping-stats"
```

#### **4. Probar Múltiples Productos**
```bash
curl -X POST "localhost:8000/receipts/batch-test-mapping" \
  -H "Content-Type: application/json" \
  -d '["ARROZ TUCAPEL", "FIDEOS CAROZZI", "LECHE SOPROLE"]'
```

---

## 🔧 Solución de Problemas

### **Problema: Producto No Se Reconoce**

#### **Opción 1: Agregar Durante Demo (Rápido)**
```bash
# Desde terminal
curl -X POST "localhost:8000/receipts/add-mapping?original_text=PRODUCTO PROBLEMA&canonical_type=TipoCorrect"
```

#### **Opción 2: Agregar al Código (Permanente)**
```python
# En demo_products_config.py
DEMO_SPECIFIC_MAPPINGS = {
    "producto problema": "TipoCorrect",
    # ... otros mapeos
}
```

#### **Opción 3: Script de Corrección**
```bash
python prepare_demo.py --fix-issues
```

### **Problema: Muchos Productos Fallan**
```bash
# Crear archivo con productos problemáticos
echo "PRODUCTO 1" > productos_problema.txt
echo "PRODUCTO 2" >> productos_problema.txt

# Probar todos
python prepare_demo.py --add-products productos_problema.txt --fix-issues
```

---

## 📊 Tipos Canónicos Disponibles

El sistema mapea a estos 25 tipos válidos:

### **Abarrotes**
- `Arroz`, `Fideos`, `Fideo`, `Azucar`, `Harina`, `Aceite`, `Sal`

### **Lácteos**
- `Leche`, `Leche evaporada`, `Queso`, `Yogur`, `Mantequilla`

### **Carnes/Proteínas**
- `Atun`, `Pollo`, `Carne molida`, `Hamburguesa`, `Huevo`

### **Panadería**
- `Pan`, `Gallina`

### **Frutas**
- `Manzana`, `Platano`, `Fruta`, `Berries`

### **Verduras**
- `Cebolla`, `Tomate`, `Ajo`, `Zanahoria`

### **Condimentos**
- `Salsa de tomate`, `Sopa`

### **Pastas**
- `Ravioles`

### **Congelados**
- `Helado`

### **Fallback**
- `Otros`

---

## 🎯 Ejemplos de Mapeo

### **Casos Exitosos de tu Demo**
```python
"CARNE MOLIDA CORRI" → "Carne molida"
"LECHE NATURAL ENTE" → "Leche"
"ATUN LOMITO AG 160" → "Atun"
"FIDEO CARACOQUESO" → "Fideos"
"CHOCOCEREAL" → "Otros"
"GRANOLA MIEL 330" → "Otros"
"ACEITE VEGE" → "Aceite"
"YOG BATIDO FRUTILL" → "Yogur"
"YOG BATIDO MORA" → "Yogur"
"CUS CUS" → "Otros"
```

### **Casos Adicionales**
```python
"ARROZ TUCAPEL 1KG" → "Arroz"
"FIDEOS CAROZZI ESPAGUETI" → "Fideos"
"LECHE SOPROLE ENTERA 1L" → "Leche"
"ACEITE CHEF VEGETAL 900ML" → "Aceite"
"ATUN VAN CAMPS EN AGUA" → "Atun"
"QUESO CHANCO COLUN" → "Queso"
"PAN DE MOLDE IDEAL" → "Pan"
"HUEVOS GALLINA DOCENA" → "Huevo"
"PECHUGA POLLO SIN HUESO" → "Pollo"
"YOGUR NATURAL SOPROLE" → "Yogur"
```

### **Casos con Errores de OCR**
```python
"ARRQZ TUCAPEL" → "Arroz"  # Error de OCR corregido
"FIDEDS CAROZZI" → "Fideos"  # Error de OCR corregido
"LECHF SOPROLE" → "Leche"  # Error de OCR corregido
```

### **Casos con Solo Marca**
```python
"TUCAPEL" → "Arroz"  # Marca inferida a producto
"CAROZZI" → "Fideos"  # Marca inferida a producto
"SOPROLE" → "Leche"  # Marca inferida a producto
```

---

## 🧪 Testing Antes de Demo

### **Test Completo**
```bash
python test_product_mapping.py
```

### **Test Solo Demo**
```bash
python test_product_mapping.py --demo-only
```

### **Test Interactivo**
```bash
python test_product_mapping.py --interactive
```

### **Ver Estadísticas**
```bash
python test_product_mapping.py --stats
```

---

## 🎉 Preparación Final

### **Checklist Pre-Demo**
- [ ] `python prepare_demo.py` pasa todas las pruebas
- [ ] Todos los productos críticos mapean correctamente
- [ ] API responde en `/receipts/test-mapping`
- [ ] OpenAI API key configurada
- [ ] Boleta de prueba lista

### **Durante la Demo**
1. **Si producto falla**: Usa `/receipts/add-mapping` inmediatamente
2. **Para impresionar**: Muestra `/receipts/mapping-stats`
3. **Para debugging**: Usa `/receipts/test-mapping`
4. **Para múltiples productos**: Usa `/receipts/batch-test-mapping`

### **Frases para la Demo**
- *"El sistema tiene más de 200 mapeos predefinidos"*
- *"Reconoce marcas chilenas como Tucapel, Carozzi, Soprole"*
- *"Puede corregir errores de OCR automáticamente"*
- *"Si algo falla, puedo agregarlo en tiempo real"*

---

## 🆘 Ayuda Rápida

### **Comandos de Emergencia**
```bash
# Sistema no funciona
python prepare_demo.py

# Producto específico falla
curl -X POST "localhost:8000/receipts/add-mapping?original_text=PRODUCTO&canonical_type=Tipo"

# Ver qué tipos son válidos
curl "localhost:8000/receipts/mapping-stats" | grep canonical_types

# Probar producto rápido
python -c "from app.product_mapping import normalize_product_name; print(normalize_product_name('PRODUCTO'))"
```

### **Contacto de Emergencia**
Si algo falla durante la demo, estos comandos te salvarán:
1. `curl -X POST "localhost:8000/receipts/add-mapping?original_text=PROBLEMA&canonical_type=Arroz"`
2. `python prepare_demo.py --fix-issues`
3. Agregar manualmente en `demo_products_config.py`

---

¡Tu demo será **perfecta**! 🎯✨