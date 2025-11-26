#!/bin/bash

# Script de diagnóstico completo para PantrySmart

echo "🔍 DIAGNÓSTICO COMPLETO DE PANTRYSMART"
echo "======================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs a probar
TUNNEL_URL="https://whole-islands-wave.loca.lt"
LOCAL_URL="http://localhost:8000"

echo ""
echo "📋 1. VERIFICANDO CONFIGURACIÓN"
echo "==============================="

# Verificar si Node.js está instalado
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js instalado: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js no encontrado${NC}"
fi

# Verificar si Python está instalado
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python instalado: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}❌ Python3 no encontrado${NC}"
fi

# Verificar si uvicorn está instalado
if command -v uvicorn &> /dev/null; then
    echo -e "${GREEN}✅ Uvicorn instalado${NC}"
else
    echo -e "${YELLOW}⚠️  Uvicorn no encontrado en PATH${NC}"
fi

echo ""
echo "🖥️  2. VERIFICANDO SERVIDOR LOCAL"
echo "================================="

# Verificar si el puerto 8000 está en uso
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅ Proceso corriendo en puerto 8000${NC}"
    
    # Probar health check local
    LOCAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$LOCAL_URL/health" --connect-timeout 5)
    if [ "$LOCAL_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Servidor local responde correctamente${NC}"
    else
        echo -e "${RED}❌ Servidor local no responde (HTTP $LOCAL_STATUS)${NC}"
    fi
else
    echo -e "${RED}❌ No hay proceso en puerto 8000${NC}"
    echo -e "${BLUE}💡 Para iniciar el servidor:${NC}"
    echo "   cd pantrysmart_app/api"
    echo "   uvicorn app.main:app --reload --port 8000"
fi

echo ""
echo "🌐 3. VERIFICANDO TÚNEL REMOTO"
echo "=============================="

# Verificar túnel
TUNNEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$TUNNEL_URL/health" --connect-timeout 10)

if [ "$TUNNEL_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Túnel funcionando correctamente${NC}"
    echo -e "${GREEN}   URL: $TUNNEL_URL${NC}"
elif [ "$TUNNEL_STATUS" = "503" ]; then
    echo -e "${RED}❌ Error 503 - Túnel no disponible${NC}"
    echo -e "${BLUE}💡 Recrear túnel:${NC}"
    echo "   ./pantrysmart_app/check_tunnel.sh"
elif [ "$TUNNEL_STATUS" = "000" ]; then
    echo -e "${RED}❌ No se puede conectar al túnel${NC}"
    echo -e "${BLUE}💡 Verificar conexión a internet${NC}"
else
    echo -e "${YELLOW}⚠️  Respuesta inesperada del túnel: HTTP $TUNNEL_STATUS${NC}"
fi

echo ""
echo "📱 4. VERIFICANDO CONFIGURACIÓN MÓVIL"
echo "====================================="

if [ -f "pantrysmart_app/mobile/config.js" ]; then
    echo -e "${GREEN}✅ Archivo config.js encontrado${NC}"
    
    # Extraer URL activa del config
    ACTIVE_URL=$(grep -o "API_URL.*" pantrysmart_app/mobile/config.js | head -1)
    echo -e "${BLUE}📡 Configuración actual: $ACTIVE_URL${NC}"
    
    # Sugerir cambios si es necesario
    if [[ "$ACTIVE_URL" == *"loca.lt"* ]] && [ "$TUNNEL_STATUS" != "200" ]; then
        echo -e "${YELLOW}⚠️  La app está configurada para usar túnel, pero el túnel no funciona${NC}"
        echo -e "${BLUE}💡 Considera cambiar a localhost en config.js${NC}"
    fi
else
    echo -e "${RED}❌ config.js no encontrado${NC}"
fi

echo ""
echo "🔧 5. VERIFICANDO DEPENDENCIAS"
echo "=============================="

# Verificar dependencias del backend
if [ -f "pantrysmart_app/api/requirements.txt" ]; then
    echo -e "${GREEN}✅ requirements.txt encontrado${NC}"
    
    # Verificar si OpenAI está instalado
    if python3 -c "import openai" 2>/dev/null; then
        echo -e "${GREEN}✅ OpenAI library instalada${NC}"
    else
        echo -e "${RED}❌ OpenAI library no encontrada${NC}"
        echo -e "${BLUE}💡 Instalar: pip install openai${NC}"
    fi
    
    # Verificar si FastAPI está instalado
    if python3 -c "import fastapi" 2>/dev/null; then
        echo -e "${GREEN}✅ FastAPI instalado${NC}"
    else
        echo -e "${RED}❌ FastAPI no encontrado${NC}"
        echo -e "${BLUE}💡 Instalar: pip install fastapi uvicorn${NC}"
    fi
else
    echo -e "${RED}❌ requirements.txt no encontrado${NC}"
fi

echo ""
echo "🔑 6. VERIFICANDO VARIABLES DE ENTORNO"
echo "======================================"

# Verificar .env en API
if [ -f "pantrysmart_app/api/.env" ]; then
    echo -e "${GREEN}✅ Archivo .env encontrado${NC}"
    
    # Verificar OPENAI_API_KEY (sin mostrar el valor)
    if grep -q "OPENAI_API_KEY" pantrysmart_app/api/.env; then
        echo -e "${GREEN}✅ OPENAI_API_KEY configurado${NC}"
    else
        echo -e "${RED}❌ OPENAI_API_KEY no encontrado en .env${NC}"
    fi
    
    # Verificar DATABASE_URL
    if grep -q "DATABASE_URL" pantrysmart_app/api/.env; then
        echo -e "${GREEN}✅ DATABASE_URL configurado${NC}"
    else
        echo -e "${RED}❌ DATABASE_URL no encontrado en .env${NC}"
    fi
else
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    echo -e "${BLUE}💡 Crear .env con:${NC}"
    echo "   OPENAI_API_KEY=tu_api_key_aqui"
    echo "   DATABASE_URL=sqlite:///./pantrysmart.db"
fi

echo ""
echo "📊 RESUMEN DEL DIAGNÓSTICO"
echo "========================="

# Determinar el problema principal
if [ "$LOCAL_STATUS" = "200" ] && [ "$TUNNEL_STATUS" = "200" ]; then
    echo -e "${GREEN}🎉 Todo está funcionando correctamente${NC}"
    echo -e "${GREEN}   Puedes usar tanto localhost como túnel${NC}"
elif [ "$LOCAL_STATUS" = "200" ] && [ "$TUNNEL_STATUS" != "200" ]; then
    echo -e "${YELLOW}⚠️  Servidor local OK, túnel con problemas${NC}"
    echo -e "${BLUE}💡 Solución: Cambiar config.js a localhost o recrear túnel${NC}"
elif [ "$LOCAL_STATUS" != "200" ] && [ "$TUNNEL_STATUS" = "200" ]; then
    echo -e "${YELLOW}⚠️  Túnel OK, servidor local con problemas${NC}"
    echo -e "${BLUE}💡 Solución: Iniciar servidor local${NC}"
else
    echo -e "${RED}❌ Tanto servidor local como túnel tienen problemas${NC}"
    echo -e "${BLUE}💡 Solución: Iniciar servidor local Y recrear túnel${NC}"
fi

echo ""
echo "🚀 COMANDOS ÚTILES"
echo "=================="
echo "Iniciar servidor:     cd pantrysmart_app/api && uvicorn app.main:app --reload --port 8000"
echo "Recrear túnel:        ./pantrysmart_app/check_tunnel.sh"
echo "Cambiar a localhost:  Editar pantrysmart_app/mobile/config.js"
echo "Ver logs del servidor: Revisar terminal donde corre uvicorn"