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

# ===== COMANDOS DB =====
# Levantar solo la base de datos
db-up:
	docker compose up --build $(DB_SERVICE)

# Ver logs de la base de datos
db-logs:
	docker compose logs -f $(DB_SERVICE)
