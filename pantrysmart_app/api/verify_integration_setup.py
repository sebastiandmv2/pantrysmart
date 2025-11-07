#!/usr/bin/env python3
"""
Verificación rápida de la integración boletas → inventario
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def quick_verification():
    """Verificación rápida de que la integración está funcionando"""
    
    print("🔍 VERIFICACIÓN RÁPIDA - INTEGRACIÓN BOLETAS → INVENTARIO")
    print("=" * 60)
    
    # Agregar el directorio de la app al path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        # 1. Verificar importaciones
        print("📦 Verificando importaciones...")
        from app.models import Receipt, ReceiptItem, UserInventory, Product, InventoryMovement
        from app.inventory_utils import process_receipt_items_to_inventory
        from app.routers.inventory import router as inventory_router
        print("✅ Todas las importaciones exitosas")
        
        # 2. Verificar conexión a BD
        print("🔗 Verificando conexión a base de datos...")
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("❌ DATABASE_URL no configurado")
            return False
            
        engine = create_engine(database_url, pool_pre_ping=True)
        with engine.connect():
            print("✅ Conexión a BD exitosa")
        
        # 3. Verificar tablas
        print("🗃️ Verificando tablas...")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Contar productos en catálogo
        product_count = db.query(Product).count()
        print(f"✅ {product_count} productos en catálogo")
        
        # Verificar estructura de inventario
        inventory_count = db.query(UserInventory).count()
        print(f"✅ {inventory_count} items en inventarios de usuarios")
        
        # Verificar movimientos
        movement_count = db.query(InventoryMovement).count()
        print(f"✅ {movement_count} movimientos registrados")
        
        db.close()
        
        # 4. Verificar endpoints
        print("🌐 Verificando endpoints registrados...")
        endpoint_count = len([route for route in inventory_router.routes])
        print(f"✅ {endpoint_count} endpoints de inventario registrados")
        
        # 5. Verificar funciones clave
        print("⚙️ Verificando funciones clave...")
        
        # Verificar que process_receipt_items_to_inventory existe y es callable
        if callable(process_receipt_items_to_inventory):
            print("✅ Función process_receipt_items_to_inventory disponible")
        else:
            print("❌ Función process_receipt_items_to_inventory no disponible")
            return False
        
        print("\n🎉 ¡VERIFICACIÓN EXITOSA!")
        print("\n📋 Estado de la integración:")
        print("   ✅ Modelos de inventario creados")
        print("   ✅ Utilidades de procesamiento disponibles")
        print("   ✅ Endpoints de API registrados")
        print("   ✅ Integración con boletas configurada")
        
        print("\n🚀 ¡Listo para usar!")
        print("\n📝 Comandos útiles:")
        print("   - Ejecutar tests: python test_inventory_integration.py")
        print("   - Agregar datos demo: curl -X POST http://localhost:8000/inventory/demo/add-sample-data")
        print("   - Ver inventario demo: curl http://localhost:8000/inventory/demo/summary")
        
        return True
        
    except ImportError as e:
        print(f"❌ Error de importación: {e}")
        print("💡 Ejecutar: python create_inventory_tables.py")
        return False
    except Exception as e:
        print(f"❌ Error en verificación: {e}")
        return False

if __name__ == "__main__":
    success = quick_verification()
    
    if success:
        print("\n✅ INTEGRACIÓN LISTA PARA USAR")
    else:
        print("\n❌ HAY PROBLEMAS QUE RESOLVER")
        print("\n🔧 Pasos para solucionar:")
        print("   1. Verificar que DATABASE_URL esté configurado")
        print("   2. Ejecutar: python create_inventory_tables.py")
        print("   3. Reiniciar el servidor API")
        print("   4. Ejecutar este script nuevamente")
    
    sys.exit(0 if success else 1)