# Nombre del servicio en docker-compose
SERVICE=api

# Help: muestra todos los comandos disponibles
help:
	@echo "Makefile - PantrySmart App"
	@echo ""
	@echo "Comandos disponibles:"
	@echo "  make up      -> Levanta el stack (con build)"
	@echo "  make upd     -> Levanta en segundo plano (detached)"
	@echo "  make down    -> Apaga todos los contenedores"
	@echo "  make logs    -> Muestra logs del servicio API"
	@echo "  make bash    -> Abre un bash dentro del contenedor API"
	@echo "  make deps    -> Instala dependencias dentro del contenedor API"
	@echo "  make versions    -> Mostrar versiones de librerías específicas"
	@echo "  make list    -> Mostrar todas las librerías instaladas en el contenedor"
	@echo "  make freeze    -> Congelar dependencias instaladas en requirements.txt"
	@echo ""

# Levantar la app con build forzado
up:
	docker compose up --build

# Levantar en background
upd:
	docker compose up -d --build

# Apagar contenedores
down:
	docker compose down

# Ver logs en vivo
logs:
	docker compose logs -f $(SERVICE)

# Ejecutar un shell dentro del contenedor de la API
bash:
	docker compose exec $(SERVICE) bash

# Instalar dependencias en el contenedor
deps:
	docker compose run --rm $(SERVICE) pip install -r requirements.txt

# Mostrar versiones de librerías específicas
versions:
	docker compose run --rm $(SERVICE) pip list | grep -E "fastapi|uvicorn|sqlalchemy|pymysql|python-dotenv|python-multipart|cryptography|openai"

# Mostrar todas las librerías instaladas en el contenedor
list:
	docker compose run --rm $(SERVICE) pip list

# Congelar dependencias instaladas en requirements.txt
freeze:
	docker compose run --rm $(SERVICE) pip freeze > api/requirements.txt
