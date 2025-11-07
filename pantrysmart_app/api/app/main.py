from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import Base, engine
from app.routers import receipts, inventory

# Importar modelos para que SQLAlchemy los registre
from app.models import Product, UserInventory, InventoryMovement

app = FastAPI(title="PantrySmart API", version="0.1.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Rutas
app.include_router(receipts.router)
app.include_router(inventory.router)

@app.get("/health")
def health():
    return {"status": "ok"}
