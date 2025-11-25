# Nombres de servicios en docker-compose
API_SERVICE=api
MOBILE_SERVICE=mobile
DB_SERVICE=db

# Help: muestra todos los comandos disponibles
help:
	@echo "Makefile - PantrySmart App"
	@echo ""
	@echo "=== COMANDOS GENERALES ==="
	@echo "  make up          -> Levanta todo el stack (API + DB + Mobile)"
	@echo "  make upd         -> Levanta en segundo plano (detached)"
	@echo "  make down        -> Apaga todos los contenedores"
	@echo "  make logs        -> Muestra logs de todos los servicios"
	@echo "  make status      -> Muestra el estado de los contenedores"
	@echo "  make dev         -> DESARROLLO COMPLETO: Levanta todo + Cloudflare + QR"
	@echo "  make dev-lt      -> Desarrollo con LocalTunnel (alternativo)"
	@echo "  make dev-local   -> Desarrollo sin túnel (solo localhost)"
	@echo "  make dev-stop    -> Para desarrollo completo (servicios + túneles)"
	@echo "  make dev-status  -> Muestra estado completo del desarrollo"
	@echo ""
	@echo "=== COMANDOS API ==="
	@echo "  make api-up      -> Levanta solo API + DB"
	@echo "  make api-logs    -> Muestra logs del servicio API"
	@echo "  make api-bash    -> Abre bash en el contenedor API"
	@echo "  make api-deps    -> Instala dependencias API"
	@echo "  make api-versions -> Versiones de librerías API"
	@echo "  make api-freeze  -> Congela dependencias en requirements.txt"
	@echo ""
	@echo "=== COMANDOS MOBILE ==="
	@echo "  make mobile-up   -> Levanta solo el frontend móvil"
	@echo "  make mobile-logs -> Muestra logs del frontend móvil"
	@echo "  make mobile-bash -> Abre shell en el contenedor móvil"
	@echo "  make mobile-deps -> Instala dependencias móvil"
	@echo "  make mobile-clean -> Limpia cache de Expo/Metro"
	@echo "  make mobile-qr   -> Muestra QR de Expo (servicios deben estar corriendo)"
	@echo ""
	@echo "=== COMANDOS DB ==="
	@echo "  make db-up       -> Levanta solo la base de datos"
	@echo "  make db-logs     -> Muestra logs de la base de datos"
	@echo ""

# ===== COMANDOS GENERALES =====
# Levantar todo el stack con build forzado
up:
	docker compose up --build

# Levantar en background
upd:
	docker compose up -d --build

# Apagar contenedores
down:
	docker compose down

# Ver logs de todos los servicios
logs:
	docker compose logs -f

# Mostrar estado de contenedores
status:
	docker compose ps

# ===== COMANDOS API =====
# Levantar solo API + DB
api-up:
	docker compose up --build $(DB_SERVICE) $(API_SERVICE)

# Ver logs de la API
api-logs:
	docker compose logs -f $(API_SERVICE)

# Ejecutar bash en el contenedor de la API
api-bash:
	docker compose exec $(API_SERVICE) bash

# Instalar dependencias de la API
api-deps:
	docker compose run --rm $(API_SERVICE) pip install -r requirements.txt

# Mostrar versiones de librerías específicas de la API
api-versions:
	docker compose run --rm $(API_SERVICE) pip list | grep -E "fastapi|uvicorn|sqlalchemy|pymysql|python-dotenv|python-multipart|cryptography|openai"

# Mostrar todas las librerías instaladas en la API
api-list:
	docker compose run --rm $(API_SERVICE) pip list

# Congelar dependencias instaladas en requirements.txt
api-freeze:
	docker compose run --rm $(API_SERVICE) pip freeze > api/requirements.txt

# ===== COMANDOS MOBILE =====
# Levantar solo el frontend móvil
mobile-up:
	docker compose up --build $(MOBILE_SERVICE)

# Ver logs del frontend móvil
mobile-logs:
	docker compose logs -f $(MOBILE_SERVICE)

# Ejecutar shell en el contenedor móvil
mobile-bash:
	docker compose exec $(MOBILE_SERVICE) sh

# Instalar dependencias del móvil
mobile-deps:
	docker compose run --rm $(MOBILE_SERVICE) npm install

# Limpiar cache de Expo/Metro
mobile-clean:
	docker compose run --rm $(MOBILE_SERVICE) npm run clear

# Ejecutar comando npm en el contenedor móvil
mobile-npm:
	docker compose run --rm $(MOBILE_SERVICE) npm $(cmd)

# Mostrar QR de Expo (fuerza la visualización)
mobile-qr:
	docker compose exec $(MOBILE_SERVICE) npx expo start --qr

# Levantar servicios en background y mostrar QR
qr:
	@echo "Levantando servicios en segundo plano..."
	docker compose up -d --build
	@echo "Esperando que los servicios estén listos..."
	sleep 10
	@echo "Mostrando QR de Expo..."
	docker compose exec $(MOBILE_SERVICE) npx expo start --qr

# ===== COMANDOS DB =====
# Levantar solo la base de datos
db-up:
	docker compose up --build $(DB_SERVICE)

# Ver logs de la base de datos
db-logs:
	docker compose logs -f $(DB_SERVICE)

# ===== COMANDOS DE DESARROLLO COMPLETO =====

# Desarrollo completo con Cloudflare (recomendado)
dev:
	@echo "🚀 Iniciando desarrollo completo de PantrySmart..."
	@echo ""
	@echo "1️⃣ Levantando servicios Docker..."
	docker compose up -d --build
	@echo ""
	@echo "2️⃣ Esperando que los servicios estén listos..."
	sleep 15
	@echo ""
	@echo "3️⃣ Verificando servidor local..."
	@if curl -s http://localhost:8000/health > /dev/null; then \
		echo "   ✅ Servidor API funcionando"; \
	else \
		echo "   ❌ Servidor API no responde"; \
		echo "   🔧 Revisa los logs: make api-logs"; \
		exit 1; \
	fi
	@echo ""
	@echo "4️⃣ Iniciando túnel Cloudflare..."
	@echo "   📡 Generando túnel estable para la API..."
	@echo "   ⏳ Esto tomará unos segundos..."
	@echo ""
	@(cloudflared tunnel --url http://localhost:8000 2>&1 | tee .tunnel_output.tmp) &
	@sleep 10
	@echo ""
	@echo "5️⃣ Configurando URL del túnel..."

	# Captura moderna y robusta de URLs de Cloudflare
	@TUNNEL_URL=$$(grep -Eo 'https://[^ ]+\.trycloudflare\.com' .tunnel_output.tmp | tail -1); \
	if [ -n "$$TUNNEL_URL" ]; then \
		echo "   🌐 Túnel generado: $$TUNNEL_URL"; \
		sed -i.bak "s|API_URL: process.env.API_URL.*|API_URL: process.env.API_URL \|\| '$$TUNNEL_URL',|" mobile/config.js; \
		echo "   ✅ config.js actualizado con $$TUNNEL_URL"; \
		echo "   🧪 Probando túnel..."; \
		sleep 3; \
		if curl -s "$$TUNNEL_URL/health" > /dev/null; then \
			echo "   ✅ Túnel funcionando correctamente"; \
		else \
			echo "   ⚠️  Túnel aún no está listo, espera unos segundos"; \
		fi; \
	else \
		echo "   ❌ ERROR: el túnel no se detectó"; \
		echo "   🔍 URL real (mira arriba en la salida de Cloudflare)"; \
		echo "   📝 Luego ejecuta: make update-tunnel-url URL=https://xxxx.trycloudflare.com"; \
        exit 1; \
	fi
	@echo ""
	@echo "6️⃣ Iniciando Expo con QR..."
	@echo "   📱 Escanea el QR con Expo Go en tu móvil"
	@echo "   🔄 Si no aparece el QR, presiona Ctrl+C y ejecuta 'make mobile-qr'"
	@echo ""
	@sleep 3
	docker compose exec $(MOBILE_SERVICE) npx expo start --tunnel

# Desarrollo con LocalTunnel (alternativo)
dev-lt:
	@echo "🚀 Iniciando desarrollo con LocalTunnel..."
	@echo ""
	@echo "1️⃣ Levantando servicios Docker..."
	docker compose up -d --build
	@echo ""
	@echo "2️⃣ Esperando que los servicios estén listos..."
	sleep 15
	@echo ""
	@echo "3️⃣ Iniciando LocalTunnel..."
	@echo "   📡 Generando túnel para la API en puerto 8000..."
	@echo "   ⏳ Esto tomará unos segundos..."
	@echo ""
	@(npx localtunnel --port 8000 --subdomain whole-islands-wave 2>&1 | tee .tunnel_output.tmp) &
	@sleep 8
	@echo ""
	@echo "4️⃣ Configurando URL del túnel..."
	@TUNNEL_URL=$$(grep -o 'https://[^[:space:]]*\.loca\.lt' .tunnel_output.tmp 2>/dev/null | head -1); \
	if [ -n "$$TUNNEL_URL" ]; then \
		echo "   🌐 Túnel generado: $$TUNNEL_URL"; \
		sed -i.bak "s|API_URL: process.env.API_URL.*|API_URL: process.env.API_URL \|\| '$$TUNNEL_URL',|" mobile/config.js; \
		echo "   ✅ config.js actualizado con $$TUNNEL_URL"; \
	else \
		echo "   ⚠️  LocalTunnel falló. Probando Cloudflare..."; \
		make dev; \
		exit 0; \
	fi
	@echo ""
	@echo "5️⃣ Iniciando Expo con QR..."
	docker compose exec $(MOBILE_SERVICE) npx expo start --tunnel

# Desarrollo sin túnel (solo localhost)
dev-local:
	@echo "🚀 Iniciando desarrollo local (sin túnel)..."
	@echo ""
	@echo "1️⃣ Levantando servicios Docker..."
	docker compose up -d --build
	@echo ""
	@echo "2️⃣ Esperando que los servicios estén listos..."
	sleep 15
	@echo ""
	@echo "3️⃣ Configurando para localhost..."
	@sed -i.bak "s|API_URL: process.env.API_URL.*|API_URL: process.env.API_URL \|\| 'http://localhost:8000',|" mobile/config.js
	@echo "   ✅ config.js configurado para localhost"
	@echo "   ⚠️  Solo funcionará si tu dispositivo está en la misma red"
	@echo ""
	@echo "4️⃣ Iniciando Expo con QR..."
	docker compose exec $(MOBILE_SERVICE) npx expo start --tunnel

# Actualizar URL del túnel manualmente
update-tunnel-url:
	@if [ -z "$(URL)" ]; then \
		echo "❌ Uso: make update-tunnel-url URL=https://tu-url.loca.lt"; \
		exit 1; \
	fi
	@echo "Actualizando config.js con URL: $(URL)"
	@sed -i.bak "s|API_URL: process.env.API_URL.*|API_URL: process.env.API_URL \|\| '$(URL)',|" mobile/config.js
	@echo "✅ config.js actualizado"

# Parar desarrollo completo
dev-stop:
	@echo "🛑 Parando desarrollo completo..."
	@echo "Parando servicios Docker..."
	docker compose down
	@echo "Parando túneles..."
	@pkill -f "cloudflared tunnel" || true
	@pkill -f "lt --port 8000" || true
	@pkill -f "localtunnel" || true
	@rm -f .tunnel_output.tmp .tunnel_url.tmp
	@echo "✅ Todo parado"

# Mostrar estado del desarrollo
dev-status:
	@echo "📊 Estado del desarrollo:"
	@echo ""
	@echo "🐳 Servicios Docker:"
	@docker compose ps
	@echo ""
	@echo "🌐 Túneles activos:"
	@if pgrep -f "cloudflared tunnel" > /dev/null; then \
		echo "   ✅ Cloudflare Tunnel corriendo"; \
	else \
		echo "   ❌ Cloudflare Tunnel no está corriendo"; \
	fi
	@if pgrep -f "lt --port 8000" > /dev/null; then \
		echo "   ✅ LocalTunnel corriendo"; \
	else \
		echo "   ❌ LocalTunnel no está corriendo"; \
	fi
	@echo ""
	@echo "📱 URL actual en config.js:"
	@grep "API_URL:" mobile/config.js
	@echo ""
	@echo "🏥 Estado del servidor:"
	@if curl -s http://localhost:8000/health > /dev/null; then \
		echo "   ✅ API local funcionando"; \
	else \
		echo "   ❌ API local no responde"; \
	fi
	@CURRENT_URL=$$(grep "API_URL:" mobile/config.js | grep -o 'https://[^'"'"']*' | head -1); \
	if [ -n "$$CURRENT_URL" ]; then \
		echo "   🌐 Probando túnel: $$CURRENT_URL"; \
		if curl -s "$$CURRENT_URL/health" > /dev/null; then \
			echo "   ✅ Túnel funcionando"; \
		else \
			echo "   ❌ Túnel no responde"; \
		fi; \
	fi
