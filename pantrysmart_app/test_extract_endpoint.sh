#!/bin/bash

# Script para probar el endpoint de extracción con una imagen de prueba

echo "🧪 PROBANDO ENDPOINT DE EXTRACCIÓN"
echo "=================================="

# URLs a probar
TUNNEL_URL="https://whole-islands-wave.loca.lt"
LOCAL_URL="http://localhost:8000"

# Usar la URL del túnel por defecto
API_URL="$TUNNEL_URL"

echo "📡 Usando API: $API_URL"

# Crear una imagen de prueba muy pequeña (1x1 pixel PNG)
echo "🖼️  Creando imagen de prueba..."

# Crear un archivo PNG mínimo en base64
TEST_IMAGE_B64="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA6VP8IQAAAABJRU5ErkJggg=="

# Decodificar y guardar como archivo temporal
echo "$TEST_IMAGE_B64" | base64 -d > /tmp/test_receipt.png

echo "✅ Imagen de prueba creada: /tmp/test_receipt.png"

# Probar el endpoint de debug primero
echo ""
echo "🔍 1. PROBANDO DEBUG UPLOAD"
echo "=========================="

DEBUG_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}" \
  -X POST \
  -F "file=@/tmp/test_receipt.png" \
  "$API_URL/receipts/debug-upload")

echo "Respuesta del debug upload:"
echo "$DEBUG_RESPONSE"

# Extraer el código de estado
DEBUG_STATUS=$(echo "$DEBUG_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
DEBUG_TIME=$(echo "$DEBUG_RESPONSE" | grep "TIME_TOTAL:" | cut -d: -f2)

echo ""
echo "📊 Debug Upload - Status: $DEBUG_STATUS, Tiempo: ${DEBUG_TIME}s"

if [ "$DEBUG_STATUS" = "200" ]; then
    echo "✅ Debug upload exitoso"
else
    echo "❌ Debug upload falló"
    echo "🔧 Verificar logs del servidor para más detalles"
fi

# Probar el endpoint de extracción
echo ""
echo "🤖 2. PROBANDO EXTRACCIÓN CON IA"
echo "==============================="

echo "⚠️  NOTA: Esto requiere OPENAI_API_KEY configurado"
echo "⏳ Esto puede tomar 10-30 segundos..."

EXTRACT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}" \
  -X POST \
  -F "file=@/tmp/test_receipt.png" \
  "$API_URL/receipts/extract-receipt" \
  --max-time 60)

echo "Respuesta de la extracción:"
echo "$EXTRACT_RESPONSE"

# Extraer el código de estado
EXTRACT_STATUS=$(echo "$EXTRACT_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
EXTRACT_TIME=$(echo "$EXTRACT_RESPONSE" | grep "TIME_TOTAL:" | cut -d: -f2)

echo ""
echo "📊 Extracción - Status: $EXTRACT_STATUS, Tiempo: ${EXTRACT_TIME}s"

if [ "$EXTRACT_STATUS" = "200" ]; then
    echo "✅ Extracción exitosa"
elif [ "$EXTRACT_STATUS" = "500" ]; then
    echo "❌ Error 500 - Probablemente falta OPENAI_API_KEY"
elif [ "$EXTRACT_STATUS" = "503" ]; then
    echo "❌ Error 503 - Servicio no disponible"
elif [ "$EXTRACT_STATUS" = "502" ]; then
    echo "❌ Error 502 - Error de OpenAI API"
else
    echo "❌ Error $EXTRACT_STATUS"
fi

# Limpiar archivo temporal
rm -f /tmp/test_receipt.png

echo ""
echo "🔧 DIAGNÓSTICO Y SOLUCIONES"
echo "=========================="

if [ "$DEBUG_STATUS" = "200" ] && [ "$EXTRACT_STATUS" = "200" ]; then
    echo "🎉 Todo funciona correctamente"
    echo "💡 El problema puede estar en la app móvil o en el tamaño de la imagen"
elif [ "$DEBUG_STATUS" = "200" ] && [ "$EXTRACT_STATUS" != "200" ]; then
    echo "⚠️  El servidor recibe archivos pero falla la IA"
    echo "🔑 Verificar OPENAI_API_KEY en el contenedor Docker"
    echo "💡 Comandos útiles:"
    echo "   docker ps (ver contenedores corriendo)"
    echo "   docker logs <container_id> (ver logs)"
    echo "   docker exec -it <container_id> env | grep OPENAI (verificar variable)"
elif [ "$DEBUG_STATUS" != "200" ]; then
    echo "❌ El servidor no puede recibir archivos"
    echo "🔧 Verificar configuración del servidor"
else
    echo "🤔 Resultado inesperado"
fi

echo ""
echo "📱 PARA PROBAR EN LA APP MÓVIL:"
echo "==============================="
echo "1. Verificar que config.js use la URL correcta: $API_URL"
echo "2. Verificar logs en la consola de la app"
echo "3. Probar con una imagen más pequeña"
echo "4. Verificar conexión a internet en el dispositivo"