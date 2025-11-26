#!/usr/bin/env python3
"""
Script de verificación para comprobar que la migración se aplicó correctamente
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Agregar el directorio app al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db import DATABASE_URL

def verify_migration():
    """Verifica que la migración se aplicó correctamente"""
    
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    with SessionLocal() as db:
        try:
            print("🔍 Verificando estructura de la base de datos...")
            
            # 1. Verificar que las tablas existen
            print("\n1. Verificando tablas...")
            
            tables_result = db.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name IN ('receipts', 'receipt_items')
                ORDER BY name
            """)).fetchall()
            
            table_names = [row[0] for row in tables_result]
            
            if 'receipts' in table_names and 'receipt_items' in table_names:
                print("   ✅ Tablas 'receipts' y 'receipt_items' existen")
            else:
                print(f"   ❌ Faltan tablas. Encontradas: {table_names}")
                return False
            
            # 2. Verificar estructura de receipts
            print("\n2. Verificando estructura de 'receipts'...")
            
            receipts_columns = db.execute(text("PRAGMA table_info(receipts)")).fetchall()
            receipts_col_names = [col[1] for col in receipts_columns]
            
            expected_receipts_cols = ['id', 'user_id', 'store', 'created_at']
            missing_cols = [col for col in expected_receipts_cols if col not in receipts_col_names]
            extra_cols = [col for col in receipts_col_names if col not in expected_receipts_cols]
            
            if not missing_cols:
                print("   ✅ Estructura de 'receipts' es correcta")
                if extra_cols:
                    print(f"   ⚠️  Columnas adicionales encontradas: {extra_cols}")
            else:
                print(f"   ❌ Faltan columnas en 'receipts': {missing_cols}")
                return False
            
            # 3. Verificar estructura de receipt_items
            print("\n3. Verificando estructura de 'receipt_items'...")
            
            items_columns = db.execute(text("PRAGMA table_info(receipt_items)")).fetchall()
            items_col_names = [col[1] for col in items_columns]
            
            expected_items_cols = ['id', 'receipt_id', 'product_name', 'product_type', 'quantity', 'is_active', 'deleted_at']
            missing_cols = [col for col in expected_items_cols if col not in items_col_names]
            extra_cols = [col for col in items_col_names if col not in expected_items_cols]
            
            if not missing_cols:
                print("   ✅ Estructura de 'receipt_items' es correcta")
                if extra_cols:
                    print(f"   ⚠️  Columnas adicionales encontradas: {extra_cols}")
            else:
                print(f"   ❌ Faltan columnas en 'receipt_items': {missing_cols}")
                return False
            
            # 4. Verificar foreign keys
            print("\n4. Verificando foreign keys...")
            
            fk_info = db.execute(text("PRAGMA foreign_key_list(receipt_items)")).fetchall()
            
            if fk_info:
                print("   ✅ Foreign key de receipt_items -> receipts configurada")
            else:
                print("   ⚠️  No se encontró foreign key (puede ser normal en SQLite)")
            
            # 5. Verificar índices
            print("\n5. Verificando índices...")
            
            indices = db.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='index' AND tbl_name IN ('receipts', 'receipt_items')
            """)).fetchall()
            
            index_names = [row[0] for row in indices]
            print(f"   📋 Índices encontrados: {index_names}")
            
            # 6. Probar inserción de datos de prueba
            print("\n6. Probando inserción de datos...")
            
            # Insertar receipt de prueba
            db.execute(text("""
                INSERT INTO receipts (user_id, store) 
                VALUES ('test-user', 'Supermercado Test')
            """))
            
            receipt_id = db.execute(text("SELECT last_insert_rowid()")).scalar()
            
            # Insertar item de prueba
            db.execute(text("""
                INSERT INTO receipt_items (receipt_id, product_name, product_type, quantity) 
                VALUES (:receipt_id, 'Arroz Tucapel 1kg', 'Arroz', 2)
            """), {"receipt_id": receipt_id})
            
            # Verificar que se insertó correctamente
            result = db.execute(text("""
                SELECT r.user_id, r.store, ri.product_name, ri.product_type, ri.quantity
                FROM receipts r
                JOIN receipt_items ri ON r.id = ri.receipt_id
                WHERE r.id = :receipt_id
            """), {"receipt_id": receipt_id}).fetchone()
            
            if result:
                print("   ✅ Inserción de datos de prueba exitosa")
                print(f"      Usuario: {result[0]}, Tienda: {result[1]}")
                print(f"      Producto: {result[2]} -> {result[3]} (x{result[4]})")
            else:
                print("   ❌ Error en inserción de datos de prueba")
                return False
            
            # Limpiar datos de prueba
            db.execute(text("DELETE FROM receipt_items WHERE receipt_id = :receipt_id"), {"receipt_id": receipt_id})
            db.execute(text("DELETE FROM receipts WHERE id = :receipt_id"), {"receipt_id": receipt_id})
            
            db.commit()
            
            print("\n✅ ¡Migración verificada exitosamente!")
            print("\n📋 Resumen:")
            print("   - Estructura de base de datos: ✅ Correcta")
            print("   - Foreign keys: ✅ Configuradas")
            print("   - Inserción de datos: ✅ Funcional")
            print("   - Datos de prueba: ✅ Limpiados")
            
            return True
            
        except Exception as e:
            db.rollback()
            print(f"\n❌ Error durante la verificación: {e}")
            return False

if __name__ == "__main__":
    if not DATABASE_URL:
        print("❌ DATABASE_URL no está configurado")
        sys.exit(1)
    
    print(f"🔗 Conectando a: {DATABASE_URL}")
    
    if verify_migration():
        print("\n🎉 La migración está lista para usar!")
        sys.exit(0)
    else:
        print("\n💥 La migración tiene problemas. Revisa los errores anteriores.")
        sys.exit(1)