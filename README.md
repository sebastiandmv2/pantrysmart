# PantrySmart
PantrySmart is a Computer Engineering thesis project at DUOC UC. A mobile app that turns receipts into a smart inventory, generating AI-based recipes, shopping lists, and alerts to save time and reduce waste.

# PantrySmart App

This project contains:
- **mobile/** → React Native frontend
- **api/** → FastAPI backend with MySQL (Dockerized)

## 🚀 Requirements
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- Git

## ⚙️ Installation

Clone the repo:
```bash
git clone https://github.com/sebastiandmv2/pantrysmart.git
```

Move into the app project folder:
```bash
cd pantrysmart_app
```

Copy environment variables:
```bash
cp .env.example .env
```

Edit `api/.env` and set your OpenAI API key:
```env
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

Build and run everything:
```bash
make upd
```

The backend will be available at:
- API: http://localhost:8000
- Interactive docs (Swagger UI): http://localhost:8000/docs
- Alternative docs (ReDoc): http://localhost:8000/redoc
- Adminer (MySQL): http://localhost:8080

## 📌 Current Endpoints

- `GET /health` → Check if the API is alive
- `POST /extract-receipt` → Upload a receipt image (jpg/png) and receive structured JSON
  - Example with curl:
    ```bash
    curl -X POST http://localhost:8000/extract-receipt \
      -H "Accept: application/json" \
      -F "file=@/path/to/receipt.jpg"
    ```

## 🗂 Environment Variables

See `api/.env.example` for required variables:
```env
# MySQL (Docker)
MYSQL_DATABASE=appdb
MYSQL_USER=appuser
MYSQL_PASSWORD=apppass
MYSQL_ROOT_PASSWORD=rootpass

# API (inside Docker the host is 'db')
DATABASE_URL=mysql+pymysql://appuser:apppass@db:3306/appdb

# Ports on your machine
API_PORT=8000
DB_PORT=3306
ADMINER_PORT=8080

# OpenAI
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

## 🛠 Useful Make commands

- `make up` → build & run containers (foreground)  
- `make upd` → build & run containers (detached)  
- `make down` → stop containers  
- `make logs` → view logs  
- `make bash` → open shell in API container  
- `make versions` → show versions of key dependencies  
- `make list` → list all dependencies installed in container  
- `make freeze` → update requirements.txt with installed dependencies  