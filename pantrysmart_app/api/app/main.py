from fastapi import FastAPI
from app.db import Base, engine
from app.routers import receipts

app = FastAPI(title="PantrySmart API", version="0.1.0")

Base.metadata.create_all(bind=engine)

# Rutas
app.include_router(receipts.router)

@app.get("/health")
def health():
    return {"status": "ok"}
