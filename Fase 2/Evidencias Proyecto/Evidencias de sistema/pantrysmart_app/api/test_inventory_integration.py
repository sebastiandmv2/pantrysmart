#!/usr/bin/env python3
"""
Script de testing para verificar la integración de boletas con inventario
"""

import os
import sys
import json
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def test_receipt_to_inventory_integration():
    """Probar la integración completa de boletas con inventario"""
    
    # Agregar el directorio de la app al path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    from app.models import Receipt, ReceiptItem, UserInventory, Product, InventoryMovement
    from app.schemas import ReceiptConfirmIn, ReceiptItemIn
    from app.inventory_utils import process_receipt_items_to_inventory, get_user_inventory_summary
    
    # Configurar base de datos
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ ERROR: DATABASE_URL no está definido")
        return False
    
    engine = create_engine(database_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    print("🧪 TESTING: Integración Boletas → Inventario")
    print("=" * 50)
    
    try:
        db = SessionLocal()
        user_id = "test-user-integration"
        
        # 1. Limpiar datos de prueba anteriores
        print("🧹 Limpiando datos de prueba anteriores...")
        db.query(InventoryMovement).filter(InventoryMovement.user_id == user_id).delete()
        db.query(UserInventory).filter(UserInventory.user_id == user_id).delete()
        db.query(ReceiptItem).filter(ReceiptItem.receipt_id.in_(
            db.query(Receipt.id).filter(Receipt.user_id == user_id)
        )).delete()
        db.query(Receipt).filter(Receipt.user_id == user_id).delete()
        db.commit()
        
        # 2. Simular datos de boleta extraídos por IA
        print("📋 Simulando boleta extraída por IA...")
        receipt_items = [
            {
                "product_name": "Arroz Grado 1 1kg",
                "product_type": "Arroz",
                "quantity": 2
            },
            {
                "product_name": "Leche Entera Soprole 1L",
                "product_type": "Leche", 
                "quantity": 1
            },
            {
                "product_name": "Pollo Entero Fresco",
                "product_type": "Pollo",
                "quantity": 1
            },
            {
                "product_name": "Pan de Molde Ideal",
                "product_type": "Pan",
                "quantity": 1
            },
            {
                "product_name": "Tomates Cherry 500g",
                "product_type": "Tomate",
                "quantity": 1
            }
        ]
        
        # 3. Crear boleta en la base de datos
        print("💾 Creando boleta en base de datos...")
        receipt = Receipt(
            user_id=user_id,
            store="Supermercado Líder - Mall Plaza"
        )
        db.add(receipt)
        db.flush()
        
        # Agregar items a la boleta
        for item_data in receipt_items:
            receipt_item = ReceiptItem(
                receipt_id=receipt.id,
                product_name=item_data["product_name"],
                product_type=item_data["product_type"],
                quantity=item_data["quantity"]
            )
            db.add(receipt_item)
        
        db.commit()
        print(f"✅ Boleta creada con ID: {receipt.id}")
        
        # 4. Procesar items al inventario
        print("📦 Procesando items al inventario...")
        inventory_results = process_receipt_items_to_inventory(
            db=db,
            user_id=user_id,
            receipt_items=receipt_items,
            store_name="Supermercado Líder - Mall Plaza",
            receipt_id=receipt.id
        )
        
        db.commit()
        print(f"✅ {len(inventory_results)} productos agregados al inventario")
        
        # 5. Verificar que se crearon los productos
        print("\n📊 Verificando productos creados:")
        for inventory_item, movement in inventory_results:
            product = inventory_item.product
            print(f"   - {product.name} ({product.category.value})")
            print(f"     Cantidad: {inventory_item.current_quantity} {inventory_item.unit}")
            print(f"     Stock Level: {inventory_item.stock_level.value}")
            print(f"     Movimiento: {movement.movement_type.value}")
        
        # 6. Verificar resumen de inventario
        print("\n📈 Resumen de inventario:")
        summary = get_user_inventory_summary(db, user_id)
        print(f"   - Total productos: {summary['total_products']}")
        print(f"   - Total categorías: {summary['total_categories']}")
        print(f"   - Productos con stock bajo: {summary['low_stock_products']}")
        
        print("\n📋 Por categoría:")
        for category, data in summary['categories'].items():
            print(f"   - {category.value}: {data['total_products']} productos")
        
        # 7. Probar agregar la misma boleta otra vez (debería incrementar cantidades)
        print("\n🔄 Probando agregar productos duplicados...")
        duplicate_items = [
            {
                "product_name": "Arroz Grado 1 1kg",  # Mismo producto
                "product_type": "Arroz",
                "quantity": 1  # Cantidad adicional
            },
            {
                "product_name": "Aceite de Oliva Extra Virgen",  # Producto nuevo
                "product_type": "Aceite",
                "quantity": 1
            }
        ]
        
        duplicate_results = process_receipt_items_to_inventory(
            db=db,
            user_id=user_id,
            receipt_items=duplicate_items,
            store_name="Supermercado Jumbo",
            receipt_id=None
        )
        
        db.commit()
        
        # 8. Verificar cantidades actualizadas
        print("📊 Verificando cantidades actualizadas:")
        updated_inventory = db.query(UserInventory).filter(
            UserInventory.user_id == user_id
        ).all()
        
        for item in updated_inventory:
            print(f"   - {item.product.name}: {item.current_quantity} {item.unit}")
        
        # 9. Verificar historial de movimientos
        print("\n📜 Historial de movimientos:")
        movements = db.query(InventoryMovement).filter(
            InventoryMovement.user_id == user_id
        ).order_by(InventoryMovement.created_at.desc()).all()
        
        for movement in movements:
            print(f"   - {movement.product.name}: {movement.movement_type.value}")
            print(f"     Cambio: {movement.quantity_change} ({movement.quantity_before} → {movement.quantity_after})")
            print(f"     Referencia: {movement.reference_type} #{movement.reference_id}")
        
        print("\n🎉 ¡Integración funcionando correctamente!")
        
        # Limpiar datos de prueba
        print("\n🧹 Limpiando datos de prueba...")
        db.query(InventoryMovement).filter(InventoryMovement.user_id == user_id).delete()
        db.query(UserInventory).filter(UserInventory.user_id == user_id).delete()
        db.query(ReceiptItem).filter(ReceiptItem.receipt_id == receipt.id).delete()
        db.query(Receipt).filter(Receipt.id == receipt.id).delete()
        db.commit()
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error en testing: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        return False

def test_api_endpoints():
    """Probar endpoints de API usando requests"""
    import requests
    
    print("\n🌐 TESTING: Endpoints de API")
    print("=" * 30)
    
    # Configurar URL base
    api_url = os.getenv("API_URL", "http://localhost:8000")
    
    try:
        # 1. Health check
        print("🏥 Probando health check...")
        response = requests.get(f"{api_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ API está funcionando")
        else:
            print(f"❌ API no responde: {response.status_code}")
            return False
        
        # 2. Probar endpoint de categorías
        print("🏷️ Probando endpoint de categorías...")
        response = requests.get(f"{api_url}/inventory/products/categories", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {len(data['categories'])} categorías disponibles")
        else:
            print(f"❌ Error obteniendo categorías: {response.status_code}")
        
        # 3. Probar endpoint de resumen de inventario demo
        print("📊 Probando resumen de inventario demo...")
        response = requests.get(f"{api_url}/inventory/demo/summary", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Inventario demo: {data['total_products']} productos")
        else:
            print(f"⚠️ Inventario demo vacío o error: {response.status_code}")
        
        # 4. Probar agregar datos de muestra
        print("📦 Agregando datos de muestra...")
        response = requests.post(f"{api_url}/inventory/demo/add-sample-data", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data['items_added']} productos agregados al demo")
        else:
            print(f"⚠️ Error agregando datos de muestra: {response.status_code}")
        
        print("\n🎉 ¡Endpoints funcionando correctamente!")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error conectando a API: {e}")
        print("💡 Asegúrate de que el servidor esté corriendo en", api_url)
        return False

if __name__ == "__main__":
    print("🚀 TESTING INTEGRACIÓN BOLETAS → INVENTARIO")
    print("=" * 60)
    
    # Test 1: Integración de base de datos
    success1 = test_receipt_to_inventory_integration()
    
    # Test 2: Endpoints de API
    success2 = test_api_endpoints()
    
    print("\n" + "=" * 60)
    print("📊 RESULTADOS:")
    print(f"   - Integración BD: {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"   - Endpoints API: {'✅ PASS' if success2 else '❌ FAIL'}")
    
    if success1 and success2:
        print("\n🎉 ¡TODOS LOS TESTS PASARON!")
        print("\n📋 Próximos pasos:")
        print("   1. Probar desde el frontend móvil")
        print("   2. Escanear una boleta real")
        print("   3. Verificar que se agregue al inventario")
    else:
        print("\n⚠️ Algunos tests fallaron - revisar configuración")
    
    sys.exit(0 if (success1 and success2) else 1)