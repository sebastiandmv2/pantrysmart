#!/bin/bash

# Script para probar con una imagen real de boleta

echo "🧾 PROBANDO CON IMAGEN REAL DE BOLETA"
echo "====================================="

API_URL="http://localhost:8000"
echo "📡 Usando API: $API_URL"

# Verificar si hay imágenes de prueba
TEST_DIR="pantrysmart_app/api/testing_files"

if [ -d "$TEST_DIR" ]; then
    echo "📁 Buscando imágenes en $TEST_DIR..."
    
    # Buscar archivos de imagen
    IMAGE_FILES=$(find "$TEST_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | head -3)
    
    if [ -z "$IMAGE_FILES" ]; then
        echo "❌ No se encontraron imágenes en $TEST_DIR"
        echo "💡 Coloca una foto de boleta en esa carpeta para probar"
        exit 1
    fi
    
    echo "🖼️  Imágenes encontradas:"
    echo "$IMAGE_FILES" | nl
    
    # Usar la primera imagen
    TEST_IMAGE=$(echo "$IMAGE_FILES" | head -1)
    echo ""
    echo "🎯 Usando imagen: $TEST_IMAGE"
    
else
    echo "❌ Directorio $TEST_DIR no encontrado"
    echo "💡 Crea el directorio y coloca una foto de boleta para probar"
    exit 1
fi

# Verificar el tamaño de la imagen
IMAGE_SIZE=$(wc -c < "$TEST_IMAGE")
IMAGE_SIZE_KB=$((IMAGE_SIZE / 1024))

echo "📊 Tamaño de imagen: ${IMAGE_SIZE_KB} KB"

if [ $IMAGE_SIZE_KB -gt 5000 ]; then
    echo "⚠️  Imagen muy grande (>5MB), puede causar timeout"
fi

# Probar health check primero
echo ""
echo "🏥 1. VERIFICANDO SERVIDOR"
echo "========================="

HEALTH_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" "$API_URL/health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Servidor disponible"
else
    echo "❌ Servidor no disponible (HTTP $HEALTH_STATUS)"
    echo "💡 Asegúrate de que el servidor esté corriendo en puerto 8000"
    exit 1
fi

# Probar debug upload
echo ""
echo "🔍 2. PROBANDO DEBUG UPLOAD"
echo "=========================="

DEBUG_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}" \
  -X POST \
  -F "file=@$TEST_IMAGE" \
  "$API_URL/receipts/debug-upload")

DEBUG_STATUS=$(echo "$DEBUG_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
DEBUG_TIME=$(echo "$DEBUG_RESPONSE" | grep "TIME_TOTAL:" | cut -d: -f2)

echo "📊 Debug Upload - Status: $DEBUG_STATUS, Tiempo: ${DEBUG_TIME}s"

if [ "$DEBUG_STATUS" = "200" ]; then
    echo "✅ Debug upload exitoso"
    # Mostrar información del archivo
    echo "$DEBUG_RESPONSE" | grep -v "HTTP_STATUS\|TIME_TOTAL" | jq . 2>/dev/null || echo "$DEBUG_RESPONSE" | grep -v "HTTP_STATUS\|TIME_TOTAL"
else
    echo "❌ Debug upload falló"
    echo "$DEBUG_RESPONSE" | grep -v "HTTP_STATUS\|TIME_TOTAL"
    exit 1
fi

# Probar extracción
echo ""
echo "🤖 3. PROBANDO EXTRACCIÓN CON IA"
echo "==============================="
echo "⏳ Esto puede tomar 30-60 segundos..."

EXTRACT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}" \
  -X POST \
  -F "file=@$TEST_IMAGE" \
  "$API_URL/receipts/extract-receipt" \
  --max-time 120)

EXTRACT_STATUS=$(echo "$EXTRACT_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
EXTRACT_TIME=$(echo "$EXTRACT_RESPONSE" | grep "TIME_TOTAL:" | cut -d: -f2)

echo ""
echo "📊 Extracción - Status: $EXTRACT_STATUS, Tiempo: ${EXTRACT_TIME}s"

if [ "$EXTRACT_STATUS" = "200" ]; then
    echo "✅ Extracción exitosa"
    echo ""
    echo "📋 DATOS EXTRAÍDOS:"
    echo "=================="
    echo "$EXTRACT_RESPONSE" | grep -v "HTTP_STATUS\|TIME_TOTAL" | jq . 2>/dev/null || echo "$EXTRACT_RESPONSE" | grep -v "HTTP_STATUS\|TIME_TOTAL"
    
    # Contar items extraídos
    ITEMS_COUNT=$(echo "$EXTRACT_RESPONSE" | grep -v "HTTP_STATUS\|TIME_TOTAL" | jq '.items | length' 2>/dev/null || echo "?")
    echo ""
    echo "📊 Productos de inventario extraídos: $ITEMS_COUNT"
    
elif [ "$EXTRACT_STATUS" = "502" ]; then
    echo "❌ Error 502 - Problema con OpenAI API"
    echo "🔍 Detalles del error:"
    echo "$EXTRACT_RESPONSE" | grep -v "HTTP_STATUS\|TIME_TOTAL" | jq . 2>/dev/null || echo "$EXTRACT_RESPONSE" | grep -v "HTTP_STATUS\|TIME_TOTAL"
elif [ "$EXTRACT_STATUS" = "500" ]; then
    echo "❌ Error 500 - Error interno del servidor"
    echo "🔍 Detalles del error:"
    echo "$EXTRACT_RESPONSE" | grep -v "HTTP_STATUS\|TIME_TOTAL"
else
    echo "❌ Error $EXTRACT_STATUS"
    echo "$EXTRACT_RESPONSE" | grep -v "HTTP_STATUS\|TIME_TOTAL"
fi

echo ""
echo "💡 CONCLUSIONES"
echo "==============="

if [ "$EXTRACT_STATUS" = "200" ]; then
    echo "🎉 ¡Todo funciona perfectamente!"
    echo "📱 La app móvil debería funcionar correctamente"
    echo "🔧 Si sigue fallando en la app, verifica:"
    echo "   - Que config.js use la URL correcta"
    echo "   - Los logs de la consola de la app"
    echo "   - La calidad/tamaño de las fotos"
elif [ "$DEBUG_STATUS" = "200" ] && [ "$EXTRACT_STATUS" != "200" ]; then
    echo "⚠️  El servidor recibe archivos pero falla la IA"
    echo "🔑 Posibles causas:"
    echo "   - OPENAI_API_KEY no configurado o inválido"
    echo "   - Límites de OpenAI API excedidos"
    echo "   - Imagen no reconocida como boleta válida"
else
    echo "❌ Hay problemas con el servidor"
    echo "🔧 Revisa la configuración y logs del servidor"
fi