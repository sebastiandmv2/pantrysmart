from fastapi import FastAPI
from app.db import Base, engine
from app.routers import receipt

app = FastAPI(title="PantrySmart API", version="0.1.0")

# Para POC: crear tablas al arrancar (luego migraremos a Alembic si hace falta)
Base.metadata.create_all(bind=engine)

# Rutas
app.include_router(receipt.router)

@app.get("/health")
def health():
    return {"status": "ok"}
