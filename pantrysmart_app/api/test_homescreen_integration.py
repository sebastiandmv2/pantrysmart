#!/usr/bin/env python3
"""
Script de testing para verificar la integración del HomeScreen con inventario real
"""

import os
import sys
import requests
import json
from datetime import datetime

def test_homescreen_api_integration():
    """Probar que los endpoints necesarios para HomeScreen funcionan"""
    
    print("🏠 TESTING: Integración HomeScreen con Inventario Real")
    print("=" * 60)
    
    # Configurar URL base
    api_url = os.getenv("API_URL", "http://localhost:8000")
    user_id = "demo-user"
    
    try:
        # 1. Health check
        print("🏥 1. Verificando health check...")
        response = requests.get(f"{api_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ API está funcionando")
        else:
            print(f"❌ API no responde: {response.status_code}")
            return False
        
        # 2. Verificar que hay datos de muestra
        print("\n📦 2. Verificando datos de muestra...")
        response = requests.post(f"{api_url}/inventory/demo/add-sample-data", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data['items_added']} productos agregados al inventario demo")
        else:
            print(f"⚠️ Error agregando datos de muestra: {response.status_code}")
        
        # 3. Probar resumen de inventario (para contador de productos)
        print("\n📊 3. Probando resumen de inventario...")
        response = requests.get(f"{api_url}/inventory/user/{user_id}/summary", timeout=5)
        if response.status_code == 200:
            summary = response.json()
            print(f"✅ Resumen obtenido:")
            print(f"   - Total productos: {summary['total_products']}")
            print(f"   - Total categorías: {summary['total_categories']}")
            print(f"   - Productos con stock bajo: {summary['low_stock_products']}")
            print(f"   - Productos próximos a vencer: {summary['expired_soon_products']}")
        else:
            print(f"❌ Error obteniendo resumen: {response.status_code}")
            return False
        
        # 4. Probar categorías (para sección de inventario por categoría)
        print("\n🏷️ 4. Probando categorías...")
        response = requests.get(f"{api_url}/inventory/products/categories", timeout=5)
        if response.status_code == 200:
            categories_data = response.json()
            print(f"✅ {len(categories_data['categories'])} categorías disponibles")
            
            # Obtener items del usuario para mapear con categorías
            response = requests.get(f"{api_url}/inventory/user/{user_id}/items", timeout=5)
            if response.status_code == 200:
                user_items = response.json()
                print(f"✅ {len(user_items)} items en inventario del usuario")
                
                # Simular agrupación por categorías
                categories_with_counts = {}
                for item in user_items:
                    category = item['product']['category']
                    if category not in categories_with_counts:
                        categories_with_counts[category] = 0
                    categories_with_counts[category] += 1
                
                print("📋 Productos por categoría:")
                for category, count in categories_with_counts.items():
                    print(f"   - {category}: {count} productos")
            else:
                print(f"⚠️ Error obteniendo items del usuario: {response.status_code}")
        else:
            print(f"❌ Error obteniendo categorías: {response.status_code}")
            return False
        
        # 5. Probar productos recientes (para sección de productos recientes)
        print("\n🕒 5. Probando productos recientes...")
        response = requests.get(f"{api_url}/inventory/user/{user_id}/items?limit=5", timeout=5)
        if response.status_code == 200:
            recent_items = response.json()
            print(f"✅ {len(recent_items)} productos recientes obtenidos")
            for item in recent_items[:3]:  # Mostrar solo los primeros 3
                print(f"   - {item['product']['name']}: {item['current_quantity']} {item['unit']} ({item['stock_level']})")
        else:
            print(f"❌ Error obteniendo productos recientes: {response.status_code}")
            return False
        
        # 6. Probar productos con stock bajo (para sección de faltantes)
        print("\n⚠️ 6. Probando productos con stock bajo...")
        response = requests.get(f"{api_url}/inventory/user/{user_id}/low-stock", timeout=5)
        if response.status_code == 200:
            low_stock_items = response.json()
            print(f"✅ {len(low_stock_items)} productos con stock bajo")
            for item in low_stock_items[:3]:  # Mostrar solo los primeros 3
                print(f"   - {item['product']['name']}: {item['current_quantity']}/{item['min_stock_alert']} {item['unit']}")
        else:
            print(f"❌ Error obteniendo productos con stock bajo: {response.status_code}")
            return False
        
        # 7. Probar agregar producto manual (para botón "Añadir producto")
        print("\n➕ 7. Probando agregar producto manual...")
        test_product = {
            "product_name": "Producto de Prueba HomeScreen",
            "category": "Abarrotes",
            "quantity": 1.0,
            "unit": "unidades",
            "store_purchased": "Tienda de Prueba"
        }
        
        response = requests.post(
            f"{api_url}/inventory/user/{user_id}/add-item",
            json=test_product,
            timeout=5
        )
        if response.status_code == 200:
            added_item = response.json()
            print(f"✅ Producto agregado: {added_item['product']['name']}")
            
            # Limpiar producto de prueba
            item_id = added_item['id']
            delete_response = requests.delete(f"{api_url}/inventory/items/{item_id}", timeout=5)
            if delete_response.status_code == 200:
                print("✅ Producto de prueba eliminado")
        else:
            print(f"❌ Error agregando producto manual: {response.status_code}")
            return False
        
        print("\n🎉 ¡TODOS LOS ENDPOINTS FUNCIONAN CORRECTAMENTE!")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error conectando a API: {e}")
        print("💡 Asegúrate de que el servidor esté corriendo en", api_url)
        return False

def test_homescreen_data_flow():
    """Simular el flujo de datos que usará el HomeScreen"""
    
    print("\n🔄 TESTING: Flujo de Datos del HomeScreen")
    print("=" * 45)
    
    api_url = os.getenv("API_URL", "http://localhost:8000")
    user_id = "demo-user"
    
    try:
        print("📱 Simulando carga de datos del HomeScreen...")
        
        # Datos que necesita el HomeScreen
        homescreen_data = {}
        
        # 1. Resumen de inventario
        response = requests.get(f"{api_url}/inventory/user/{user_id}/summary", timeout=5)
        if response.status_code == 200:
            homescreen_data['summary'] = response.json()
            print("✅ Resumen de inventario cargado")
        
        # 2. Categorías con productos
        response = requests.get(f"{api_url}/inventory/products/categories", timeout=5)
        if response.status_code == 200:
            categories_config = response.json()
            
            # Obtener items del usuario
            response = requests.get(f"{api_url}/inventory/user/{user_id}/items", timeout=5)
            if response.status_code == 200:
                user_items = response.json()
                
                # Agrupar por categorías
                categories_with_counts = []
                for category in categories_config['categories']:
                    category_items = [item for item in user_items if item['product']['category'] == category['id']]
                    if len(category_items) > 0:  # Solo incluir categorías con productos
                        categories_with_counts.append({
                            'id': category['id'],
                            'name': category['name'],
                            'icon': category['icon'],
                            'color': category['color'],
                            'count': len(category_items)
                        })
                
                homescreen_data['categories'] = categories_with_counts
                print(f"✅ {len(categories_with_counts)} categorías con productos cargadas")
        
        # 3. Productos recientes
        response = requests.get(f"{api_url}/inventory/user/{user_id}/items?limit=10", timeout=5)
        if response.status_code == 200:
            recent_items = response.json()
            homescreen_data['recent_products'] = recent_items[:5]  # Solo los 5 más recientes
            print(f"✅ {len(homescreen_data['recent_products'])} productos recientes cargados")
        
        # 4. Productos con stock bajo
        response = requests.get(f"{api_url}/inventory/user/{user_id}/low-stock", timeout=5)
        if response.status_code == 200:
            low_stock_items = response.json()
            homescreen_data['low_stock_products'] = low_stock_items
            print(f"✅ {len(low_stock_items)} productos con stock bajo cargados")
        
        # Mostrar resumen de datos para HomeScreen
        print("\n📊 DATOS PARA HOMESCREEN:")
        print(f"   📦 Total productos: {homescreen_data['summary']['total_products']}")
        print(f"   🏷️ Categorías activas: {len(homescreen_data['categories'])}")
        print(f"   🕒 Productos recientes: {len(homescreen_data['recent_products'])}")
        print(f"   ⚠️ Stock bajo: {len(homescreen_data['low_stock_products'])}")
        
        # Simular datos que mostraría el HomeScreen
        print("\n📱 VISTA PREVIA DEL HOMESCREEN:")
        print(f"   Encabezado: 'Tienes {homescreen_data['summary']['total_products']} productos en tu despensa'")
        print(f"   KPI Stock bajo: '{homescreen_data['summary']['low_stock_products']} productos'")
        print(f"   KPI Categorías: '{homescreen_data['summary']['total_categories']}'")
        
        if homescreen_data['categories']:
            print("   Categorías:")
            for cat in homescreen_data['categories'][:3]:
                print(f"     - {cat['name']}: {cat['count']} productos")
        
        if homescreen_data['recent_products']:
            print("   Productos recientes:")
            for item in homescreen_data['recent_products'][:3]:
                print(f"     - {item['product']['name']}: {item['current_quantity']} {item['unit']} ({item['stock_level']})")
        
        print("\n🎉 ¡FLUJO DE DATOS SIMULADO EXITOSAMENTE!")
        return True
        
    except Exception as e:
        print(f"❌ Error en flujo de datos: {e}")
        return False

if __name__ == "__main__":
    print("🚀 TESTING INTEGRACIÓN HOMESCREEN → INVENTARIO REAL")
    print("=" * 70)
    
    # Test 1: Endpoints de API
    success1 = test_homescreen_api_integration()
    
    # Test 2: Flujo de datos
    success2 = test_homescreen_data_flow()
    
    print("\n" + "=" * 70)
    print("📊 RESULTADOS:")
    print(f"   - Endpoints API: {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"   - Flujo de datos: {'✅ PASS' if success2 else '❌ FAIL'}")
    
    if success1 and success2:
        print("\n🎉 ¡HOMESCREEN LISTO PARA USAR DATOS REALES!")
        print("\n📋 Próximos pasos:")
        print("   1. Reiniciar la app móvil")
        print("   2. Verificar que el HomeScreen carga datos reales")
        print("   3. Probar agregar productos manualmente")
        print("   4. Escanear boletas y ver actualización automática")
    else:
        print("\n⚠️ Algunos tests fallaron - revisar configuración")
    
    sys.exit(0 if (success1 and success2) else 1)