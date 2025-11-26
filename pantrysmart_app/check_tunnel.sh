#!/bin/bash

# Script para verificar y recrear el túnel LocalTunnel

API_URL="https://whole-islands-wave.loca.lt"
LOCAL_PORT="8000"

echo "🔍 Verificando estado del túnel..."
echo "📡 URL del túnel: $API_URL"

# Verificar si el túnel responde
echo "🏥 Probando health check..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" --connect-timeout 10)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Túnel funcionando correctamente (HTTP $HTTP_STATUS)"
    echo "🎉 Todo está listo para usar!"
    exit 0
elif [ "$HTTP_STATUS" = "503" ]; then
    echo "❌ Error 503 - Túnel no disponible"
elif [ "$HTTP_STATUS" = "000" ]; then
    echo "❌ No se puede conectar al túnel"
else
    echo "⚠️  Respuesta inesperada: HTTP $HTTP_STATUS"
fi

echo ""
echo "🔧 Intentando recrear el túnel..."

# Verificar si el servidor local está corriendo
echo "🖥️  Verificando servidor local en puerto $LOCAL_PORT..."
LOCAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$LOCAL_PORT/health" --connect-timeout 5)

if [ "$LOCAL_STATUS" != "200" ]; then
    echo "❌ Servidor local no está corriendo en puerto $LOCAL_PORT"
    echo "💡 Inicia el servidor con: cd pantrysmart_app/api && uvicorn app.main:app --reload --port $LOCAL_PORT"
    exit 1
fi

echo "✅ Servidor local funcionando"

# Matar procesos existentes de localtunnel
echo "🧹 Limpiando túneles existentes..."
pkill -f "lt --port" 2>/dev/null || true

# Crear nuevo túnel
echo "🚇 Creando nuevo túnel..."
echo "📝 Comando: npx localtunnel --port $LOCAL_PORT --subdomain whole-islands-wave"

# Ejecutar en background y esperar un momento
npx localtunnel --port $LOCAL_PORT --subdomain whole-islands-wave &
TUNNEL_PID=$!

echo "⏳ Esperando que el túnel se establezca..."
sleep 5

# Verificar el nuevo túnel
echo "🔍 Verificando nuevo túnel..."
NEW_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" --connect-timeout 10)

if [ "$NEW_STATUS" = "200" ]; then
    echo "✅ ¡Túnel recreado exitosamente!"
    echo "🎯 URL: $API_URL"
    echo "🔄 PID del túnel: $TUNNEL_PID"
    echo ""
    echo "💡 Para mantener el túnel activo, deja esta terminal abierta"
    echo "💡 Para detener el túnel: kill $TUNNEL_PID"
    
    # Mantener el script corriendo para mostrar logs
    echo ""
    echo "📊 Logs del túnel (Ctrl+C para salir):"
    wait $TUNNEL_PID
else
    echo "❌ No se pudo recrear el túnel"
    echo "🔧 Intenta manualmente:"
    echo "   npx localtunnel --port $LOCAL_PORT --subdomain whole-islands-wave"
    kill $TUNNEL_PID 2>/dev/null || true
    exit 1
fi