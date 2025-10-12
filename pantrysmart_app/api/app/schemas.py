from pydantic import BaseModel, Field, conint
from typing import List, Optional

CATEGORIES = ['Alimentos','Bebidas','Higiene','Limpieza','Salud','Mascotas','Hogar','Bebé','Alcohol','Otros']

class ReceiptItemIn(BaseModel):
    product_name: str
    category: str = Field(..., description=f"One of: {CATEGORIES}")
    quantity: conint(ge=1)
    unit_price: conint(ge=0)
    total_price: conint(ge=0)

class ReceiptConfirmIn(BaseModel):
    user_id: Optional[str] = None
    store: str
    date: str   # YYYY-MM-DD
    time: str   # HH:MM:SS
    items: List[ReceiptItemIn]
    subtotal: conint(ge=0)

class ReceiptItemOut(BaseModel):
    id: int
    product_name: str
    category: str
    quantity: int
    unit_price: int
    total_price: int
    is_active: bool
    class Config:
        from_attributes = True

class ReceiptOut(BaseModel):
    id: int
    user_id: str
    store: str
    date: str
    time: str
    subtotal: int
    items: List[ReceiptItemOut]
    class Config:
        from_attributes = True
