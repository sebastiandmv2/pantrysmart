#!/usr/bin/env python3
"""
Script de migración para actualizar la estructura de la base de datos
de receipts para el nuevo schema de inventario.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Agregar el directorio app al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db import DATABASE_URL

def migrate_database():
    """Ejecuta las migraciones necesarias para el nuevo schema"""
    
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    with SessionLocal() as db:
        try:
            print("Iniciando migración de la base de datos...")
            
            # 1. Crear tabla temporal para backup de datos existentes
            print("1. Creando backup de datos existentes...")
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS receipts_backup AS 
                SELECT * FROM receipts
            """))
            
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS receipt_items_backup AS 
                SELECT * FROM receipt_items
            """))
            
            # 2. Eliminar tablas existentes
            print("2. Eliminando tablas existentes...")
            db.execute(text("DROP TABLE IF EXISTS receipt_items"))
            db.execute(text("DROP TABLE IF EXISTS receipts"))
            
            # 3. Crear nuevas tablas con la estructura actualizada
            print("3. Creando nuevas tablas...")
            
            # Tabla receipts actualizada
            db.execute(text("""
                CREATE TABLE receipts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id VARCHAR(100) NOT NULL,
                    store VARCHAR(255),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
            """))
            
            # Tabla receipt_items actualizada
            db.execute(text("""
                CREATE TABLE receipt_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    receipt_id INTEGER NOT NULL,
                    product_name VARCHAR(255) NOT NULL,
                    product_type VARCHAR(255) NOT NULL,
                    quantity INTEGER NOT NULL,
                    is_active BOOLEAN DEFAULT 1 NOT NULL,
                    deleted_at DATETIME,
                    FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
                )
            """))
            
            # 4. Crear índices
            print("4. Creando índices...")
            db.execute(text("CREATE INDEX ix_receipts_id ON receipts (id)"))
            db.execute(text("CREATE INDEX ix_receipt_items_receipt_id ON receipt_items (receipt_id)"))
            
            # 5. Migrar datos existentes si los hay (opcional)
            print("5. Verificando datos existentes...")
            backup_count = db.execute(text("SELECT COUNT(*) FROM receipts_backup")).scalar()
            
            if backup_count > 0:
                print(f"   Encontrados {backup_count} receipts en backup")
                print("   NOTA: Los datos antiguos están en las tablas *_backup")
                print("   Deberás migrar manualmente los datos importantes")
            else:
                print("   No se encontraron datos existentes")
            
            db.commit()
            print("✅ Migración completada exitosamente!")
            
        except Exception as e:
            db.rollback()
            print(f"❌ Error durante la migración: {e}")
            raise
        
        finally:
            # Limpiar tablas de backup si todo salió bien
            try:
                print("6. Limpiando tablas de backup...")
                db.execute(text("DROP TABLE IF EXISTS receipts_backup"))
                db.execute(text("DROP TABLE IF EXISTS receipt_items_backup"))
                db.commit()
                print("   Backup limpiado")
            except:
                print("   No se pudo limpiar el backup (no es crítico)")

if __name__ == "__main__":
    if not DATABASE_URL:
        print("❌ DATABASE_URL no está configurado")
        sys.exit(1)
    
    print(f"Conectando a: {DATABASE_URL}")
    response = input("¿Continuar con la migración? (y/N): ")
    
    if response.lower() in ['y', 'yes', 'sí', 'si']:
        migrate_database()
    else:
        print("Migración cancelada")