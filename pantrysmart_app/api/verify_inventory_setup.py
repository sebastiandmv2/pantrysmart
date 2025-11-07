#!/usr/bin/env python3
"""
Script de verificación del setup de inventario
Verifica que las tablas, modelos y configuraciones estén correctas
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def verify_database_connection():
    """Verificar conexión a la base de datos"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ ERROR: DATABASE_URL no está definido")
        return False
    
    try:
        engine = create_engine(database_url, pool_pre_ping=True)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Conexión a base de datos exitosa")
            return True
    except Exception as e:
        print(f"❌ Error conectando a base de datos: {e}")
        return False

def verify_tables_exist():
    """Verificar que las tablas de inventario existen"""
    database_url = os.getenv("DATABASE_URL")
    engine = create_engine(database_url, pool_pre_ping=True)
    
    required_tables = ['products', 'user_inventory', 'inventory_movements']
    
    try:
        with engine.connect() as conn:
            for table in required_tables:
                result = conn.execute(text(f"SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '{table}'"))
                if result.scalar() > 0:
                    print(f"✅ Tabla '{table}' existe")
                else:
                    print(f"❌ Tabla '{table}' NO existe")
                    return False
        return True
    except Exception as e:
        print(f"❌ Error verificando tablas: {e}")
        return False

def verify_models_import():
    """Verificar que los modelos se pueden importar correctamente"""
    try:
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        
        from app.models import Product, UserInventory, InventoryMovement, ProductCategory, StockLevel, MovementType
        print("✅ Modelos importados correctamente")
        
        # Verificar enums
        print(f"✅ ProductCategory tiene {len(ProductCategory)} categorías")
        print(f"✅ StockLevel tiene {len(StockLevel)} niveles")
        print(f"✅ MovementType tiene {len(MovementType)} tipos")
        
        return True
    except Exception as e:
        print(f"❌ Error importando modelos: {e}")
        return False

def verify_schemas_import():
    """Verificar que los schemas se pueden importar correctamente"""
    try:
        from app.schemas import (
            ProductCreate, ProductOut, UserInventoryCreate, UserInventoryOut,
            InventoryMovementCreate, InventoryMovementOut, ProductCategoryEnum,
            StockLevelEnum, MovementTypeEnum
        )
        print("✅ Schemas importados correctamente")
        return True
    except Exception as e:
        print(f"❌ Error importando schemas: {e}")
        return False

def verify_config_import():
    """Verificar que la configuración se puede importar correctamente"""
    try:
        from app.inventory_config import (
            CATEGORY_CONFIG, STOCK_LEVEL_CONFIG, get_stock_level,
            get_food_categories, get_categories_for_frontend
        )
        print("✅ Configuración de inventario importada correctamente")
        
        # Verificar configuraciones
        food_categories = get_food_categories()
        print(f"✅ {len(food_categories)} categorías de alimentos configuradas")
        
        frontend_categories = get_categories_for_frontend()
        print(f"✅ {len(frontend_categories)} categorías para frontend")
        
        return True
    except Exception as e:
        print(f"❌ Error importando configuración: {e}")
        return False

def verify_utils_import():
    """Verificar que las utilidades se pueden importar correctamente"""
    try:
        from app.inventory_utils import (
            find_or_create_product, get_or_create_inventory_item,
            add_to_inventory, get_user_inventory_summary
        )
        print("✅ Utilidades de inventario importadas correctamente")
        return True
    except Exception as e:
        print(f"❌ Error importando utilidades: {e}")
        return False

def verify_sample_data():
    """Verificar que hay datos de muestra en la base de datos"""
    try:
        database_url = os.getenv("DATABASE_URL")
        engine = create_engine(database_url, pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        from app.models import Product
        
        db = SessionLocal()
        product_count = db.query(Product).count()
        
        if product_count > 0:
            print(f"✅ {product_count} productos en el catálogo")
            
            # Mostrar algunos productos de ejemplo
            sample_products = db.query(Product).limit(5).all()
            print("📦 Productos de ejemplo:")
            for product in sample_products:
                print(f"   - {product.name} ({product.category.value})")
        else:
            print("⚠️  No hay productos en el catálogo - ejecutar populate_initial_products()")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error verificando datos de muestra: {e}")
        return False

def run_full_verification():
    """Ejecutar verificación completa"""
    print("🔍 VERIFICACIÓN DEL SETUP DE INVENTARIO")
    print("=" * 50)
    
    checks = [
        ("Conexión a base de datos", verify_database_connection),
        ("Existencia de tablas", verify_tables_exist),
        ("Importación de modelos", verify_models_import),
        ("Importación de schemas", verify_schemas_import),
        ("Importación de configuración", verify_config_import),
        ("Importación de utilidades", verify_utils_import),
        ("Datos de muestra", verify_sample_data),
    ]
    
    passed = 0
    total = len(checks)
    
    for check_name, check_func in checks:
        print(f"\n🔍 {check_name}...")
        if check_func():
            passed += 1
        else:
            print(f"❌ Falló: {check_name}")
    
    print("\n" + "=" * 50)
    print(f"📊 RESULTADO: {passed}/{total} verificaciones pasaron")
    
    if passed == total:
        print("🎉 ¡Setup de inventario completado exitosamente!")
        print("\n📋 Próximos pasos:")
        print("   1. Crear endpoints de API para inventario")
        print("   2. Integrar con el frontend móvil")
        print("   3. Conectar con el flujo de boletas")
        return True
    else:
        print("⚠️  Hay problemas que necesitan ser resueltos")
        return False

if __name__ == "__main__":
    success = run_full_verification()
    sys.exit(0 if success else 1)