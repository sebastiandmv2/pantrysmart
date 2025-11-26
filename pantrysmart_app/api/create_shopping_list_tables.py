"""
Script para crear las tablas de lista de compras en la base de datos
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models import Base, ShoppingListItem

def create_shopping_list_tables():
    """Crear tablas de lista de compras"""
    print("🛒 Creando tablas de lista de compras...")
    
    try:
        # Crear todas las tablas (solo las nuevas se crearán)
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas de lista de compras creadas exitosamente!")
        
        # Verificar que la tabla existe
        db = SessionLocal()
        try:
            # Intentar hacer una consulta simple para verificar
            count = db.query(ShoppingListItem).count()
            print(f"✅ Tabla shopping_list_items verificada (contiene {count} items)")
        except Exception as e:
            print(f"⚠️ Error verificando tabla: {e}")
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Error creando tablas: {e}")
        return False
    
    return True

if __name__ == "__main__":
    create_shopping_list_tables()