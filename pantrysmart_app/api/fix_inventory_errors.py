#!/usr/bin/env python3
"""
Script para diagnosticar y corregir errores en el sistema de inventario
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

def diagnose_and_fix_inventory_errors():
    """Diagnosticar y corregir errores comunes en el inventario"""
    
    print("🔧 DIAGNÓSTICO Y CORRECCIÓN DE ERRORES DE INVENTARIO")
    print("=" * 60)
    
    # Agregar el directorio de la app al path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        # Configurar base de datos
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("❌ ERROR: DATABASE_URL no está definido")
            return False
        
        engine = create_engine(database_url, pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        from app.models import Product, UserInventory, InventoryMovement, ProductCategory, StockLevel
        from app.inventory_utils import get_user_inventory_summary
        
        print("🔗 Conectando a la base de datos...")
        db = SessionLocal()
        
        # 1. Verificar tablas existen
        print("\n📋 1. Verificando estructura de tablas...")
        
        tables_to_check = ['products', 'user_inventory', 'inventory_movements']
        for table in tables_to_check:
            try:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"✅ Tabla '{table}': {count} registros")
            except Exception as e:
                print(f"❌ Error en tabla '{table}': {e}")
                return False
        
        # 2. Verificar datos corruptos
        print("\n🔍 2. Verificando integridad de datos...")
        
        # Verificar items de inventario sin producto
        orphaned_inventory = db.execute(text("""
            SELECT ui.id, ui.user_id, ui.product_id 
            FROM user_inventory ui 
            LEFT JOIN products p ON ui.product_id = p.id 
            WHERE p.id IS NULL
        """)).fetchall()
        
        if orphaned_inventory:
            print(f"⚠️ Encontrados {len(orphaned_inventory)} items de inventario sin producto asociado")
            print("🧹 Limpiando items huérfanos...")
            for item in orphaned_inventory:
                db.execute(text("DELETE FROM user_inventory WHERE id = :id"), {"id": item[0]})
            db.commit()
            print("✅ Items huérfanos eliminados")
        else:
            print("✅ No se encontraron items huérfanos")
        
        # 3. Verificar y corregir niveles de stock
        print("\n📊 3. Verificando niveles de stock...")
        
        inventory_items = db.query(UserInventory).all()
        corrected_count = 0
        
        for item in inventory_items:
            # Recalcular nivel de stock
            if item.current_quantity <= 0:
                new_level = StockLevel.AGOTADO
            elif item.current_quantity <= (item.min_stock_alert or 1.0):
                new_level = StockLevel.BAJO
            elif item.current_quantity <= (item.min_stock_alert or 1.0) * 2:
                new_level = StockLevel.MEDIO
            else:
                new_level = StockLevel.ALTO
            
            if item.stock_level != new_level:
                item.stock_level = new_level
                corrected_count += 1
        
        if corrected_count > 0:
            db.commit()
            print(f"✅ Corregidos {corrected_count} niveles de stock")
        else:
            print("✅ Todos los niveles de stock están correctos")
        
        # 4. Probar función de resumen
        print("\n📈 4. Probando función de resumen...")
        
        try:
            summary = get_user_inventory_summary(db, "demo-user")
            print("✅ Función de resumen funciona correctamente:")
            print(f"   - Total productos: {summary['total_products']}")
            print(f"   - Categorías: {summary['total_categories']}")
            print(f"   - Stock bajo: {summary['low_stock_products']}")
        except Exception as e:
            print(f"❌ Error en función de resumen: {e}")
            print("🔧 Intentando corrección...")
            
            # Crear datos mínimos si no existen
            if db.query(Product).count() == 0:
                print("📦 Creando productos básicos...")
                basic_products = [
                    {"name": "Arroz", "category": ProductCategory.ABARROTES},
                    {"name": "Leche", "category": ProductCategory.LACTEOS},
                    {"name": "Pan", "category": ProductCategory.PANADERIA},
                ]
                
                for prod_data in basic_products:
                    product = Product(
                        name=prod_data["name"],
                        category=prod_data["category"],
                        description=f"Producto {prod_data['name']}",
                        default_unit="unidades",
                        is_perishable=False
                    )
                    db.add(product)
                
                db.commit()
                print("✅ Productos básicos creados")
        
        # 5. Verificar relaciones
        print("\n🔗 5. Verificando relaciones entre tablas...")
        
        # Verificar que todos los items de inventario tienen productos válidos
        inventory_with_products = db.query(UserInventory).join(Product).count()
        total_inventory = db.query(UserInventory).count()
        
        print(f"✅ Items de inventario con productos válidos: {inventory_with_products}/{total_inventory}")
        
        if inventory_with_products != total_inventory:
            print("⚠️ Hay inconsistencias en las relaciones")
            # Ya se limpiaron arriba
        
        # 6. Probar endpoints críticos
        print("\n🌐 6. Probando endpoints críticos...")
        
        try:
            # Simular llamada a resumen
            summary = get_user_inventory_summary(db, "demo-user")
            print("✅ Endpoint de resumen: OK")
            
            # Simular llamada a items
            items = db.query(UserInventory).filter(UserInventory.user_id == "demo-user").all()
            print(f"✅ Endpoint de items: {len(items)} items encontrados")
            
        except Exception as e:
            print(f"❌ Error en endpoints: {e}")
            return False
        
        db.close()
        
        print("\n🎉 ¡DIAGNÓSTICO COMPLETADO!")
        print("\n📋 Resumen de correcciones:")
        print("   ✅ Estructura de tablas verificada")
        print("   ✅ Datos corruptos limpiados")
        print("   ✅ Niveles de stock corregidos")
        print("   ✅ Relaciones verificadas")
        print("   ✅ Endpoints funcionando")
        
        return True
        
    except Exception as e:
        print(f"❌ Error crítico: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        return False

def create_sample_data_if_empty():
    """Crear datos de muestra si el inventario está vacío"""
    
    print("\n📦 CREANDO DATOS DE MUESTRA...")
    
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        database_url = os.getenv("DATABASE_URL")
        engine = create_engine(database_url, pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        from app.models import Product, UserInventory, ProductCategory, StockLevel
        from app.inventory_utils import add_to_inventory
        from datetime import datetime, timedelta
        
        db = SessionLocal()
        
        # Verificar si ya hay datos
        existing_items = db.query(UserInventory).filter(UserInventory.user_id == "demo-user").count()
        
        if existing_items > 0:
            print(f"✅ Ya existen {existing_items} items en el inventario")
            db.close()
            return True
        
        print("📦 Creando datos de muestra...")
        
        sample_items = [
            {"name": "Arroz integral 1kg", "category": ProductCategory.ABARROTES, "quantity": 2.0, "unit": "kg"},
            {"name": "Leche entera Soprole 1L", "category": ProductCategory.LACTEOS, "quantity": 1.0, "unit": "litros"},
            {"name": "Leche descremada Colun 1L", "category": ProductCategory.LACTEOS, "quantity": 1.0, "unit": "litros"},
            {"name": "Queso mantecoso Colun", "category": ProductCategory.LACTEOS, "quantity": 0.2, "unit": "kg"},
            {"name": "Pollo entero fresco", "category": ProductCategory.CARNES, "quantity": 1.5, "unit": "kg"},
            {"name": "Pan de molde Ideal", "category": ProductCategory.PANADERIA, "quantity": 1.0, "unit": "unidades"},
            {"name": "Lechuga iceberg", "category": ProductCategory.VERDURAS, "quantity": 1.0, "unit": "unidades"},
            {"name": "Lechuga romana", "category": ProductCategory.VERDURAS, "quantity": 1.0, "unit": "unidades"},
            {"name": "Tomates cherry 500g", "category": ProductCategory.VERDURAS, "quantity": 0.5, "unit": "kg"},
            {"name": "Manzanas rojas", "category": ProductCategory.FRUTAS, "quantity": 1.0, "unit": "kg"},
            {"name": "Aceite de oliva", "category": ProductCategory.CONDIMENTOS, "quantity": 0.5, "unit": "litros"},
        ]
        
        created_count = 0
        for item_data in sample_items:
            try:
                inventory_item, movement = add_to_inventory(
                    db=db,
                    user_id="demo-user",
                    product_name=item_data["name"],
                    category=item_data["category"],
                    quantity=item_data["quantity"],
                    unit=item_data["unit"],
                    purchase_date=datetime.utcnow() - timedelta(days=1),
                    store_purchased="Supermercado Demo"
                )
                created_count += 1
                print(f"✅ Creado: {item_data['name']}")
            except Exception as e:
                print(f"⚠️ Error creando {item_data['name']}: {e}")
                continue
        
        db.commit()
        db.close()
        
        print(f"🎉 ¡{created_count} productos creados exitosamente!")
        return True
        
    except Exception as e:
        print(f"❌ Error creando datos de muestra: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        return False

if __name__ == "__main__":
    print("🚀 CORRECCIÓN DE ERRORES DE INVENTARIO")
    print("=" * 50)
    
    # Paso 1: Diagnosticar y corregir errores
    success1 = diagnose_and_fix_inventory_errors()
    
    # Paso 2: Crear datos de muestra si es necesario
    success2 = create_sample_data_if_empty()
    
    print("\n" + "=" * 50)
    print("📊 RESULTADOS:")
    print(f"   - Diagnóstico y corrección: {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"   - Datos de muestra: {'✅ PASS' if success2 else '❌ FAIL'}")
    
    if success1 and success2:
        print("\n🎉 ¡INVENTARIO CORREGIDO Y LISTO!")
        print("\n📋 Próximos pasos:")
        print("   1. Reiniciar el servidor API")
        print("   2. Probar el HomeScreen en la app móvil")
        print("   3. Verificar que no hay más errores 500")
        print("   4. Probar la nueva pantalla de inventario")
    else:
        print("\n⚠️ Algunos problemas no se pudieron resolver")
        print("💡 Revisar logs de errores y configuración de base de datos")
    
    sys.exit(0 if (success1 and success2) else 1)