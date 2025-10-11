from fastapi import FastAPI
from app.db import Base, engine

app = FastAPI(title="PantrySmart API", version="0.1.0")

# Para POC: crear tablas al arrancar (luego migraremos a Alembic si hace falta)
Base.metadata.create_all(bind=engine)

@app.get("/health")
def health():
    return {"status": "ok"}
