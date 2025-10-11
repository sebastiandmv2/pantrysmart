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
cd pantrysmart_app
```

Move into the app project folder:
```bash
cd pantrysmart_app
```

Copy environment variables:
```bash
cp .env.example .env
```

Build and run everything:
```bash
docker compose up --build
```

The backend will be available at:
- API: http://localhost:8000
- Interactive docs (Swagger UI): http://localhost:8000/docs
- Adminer (MySQL): http://localhost:8080

## 📌 Current Endpoints

- `GET /health` → Check if the API is alive
- `POST /process/image` → Upload an image and receive a placeholder JSON
- `POST /ingest` → Send a JSON payload and store it in MySQL

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
```
