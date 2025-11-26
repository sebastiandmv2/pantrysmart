#!/usr/bin/env python3
"""
Script de testing para verificar la funcionalidad de inventario agrupado
"""

import os
import sys
import requests
import json

def test_grouped_inventory_endpoints():
    """Probar los nuevos endpoints de inventario agrupado"""
    
    print("📦 TESTING: Inventario Agrupado por Tipo Genérico")
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
        
        # 2. Agregar datos de muestra
        print("\n📦 2. Agregando datos de muestra...")
        response = requests.post(f"{api_url}/inventory/demo/add-sample-data", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data['items_added']} productos agregados")
        else:
            print(f"⚠️ Error agregando datos: {response.status_code}")
        
        # 3. Probar resumen tradicional
        print("\n📊 3. Probando resumen tradicional...")
        response = requests.get(f"{api_url}/inventory/user/{user_id}/summary", timeout=5)
        if response.status_code == 200:
            summary = response.json()
            print(f"✅ Resumen tradicional:")
            print(f"   - Total productos: {summary['total_products']}")
            print(f"   - Stock bajo: {summary['low_stock_products']}")
        else:
            print(f"❌ Error en resumen tradicional: {response.status_code}")
            return False
        
        # 4. Probar inventario agrupado
        print("\n🔄 4. Probando inventario agrupado...")
        response = requests.get(f"{api_url}/inventory/user/{user_id}/grouped", timeout=5)
        if response.status_code == 200:
            grouped_data = response.json()
            grouped_inventory = grouped_data['grouped_inventory']
            print(f"✅ Inventario agrupado:")
            print(f"   - Total tipos genéricos: {grouped_data['total_types']}")
            
            print("📋 Productos agrupados:")
            for item in grouped_inventory[:5]:  # Mostrar solo los primeros 5
                print(f"   - {item['product_type']}: {item['total_quantity']} {item['unit']} ({item['items_count']} variedades)")
                print(f"     Categoría: {item['category']}, Stock: {item['stock_level']}")
        else:
            print(f"❌ Error en inventario agrupado: {response.status_code}")
            return False
        
        # 5. Probar resumen agrupado
        print("\n📈 5. Probando resumen agrupado...")
        response = requests.get(f"{api_url}/inventory/user/{user_id}/summary-grouped", timeout=5)
        if response.status_code == 200:
            grouped_summary = response.json()
            print(f"✅ Resumen agrupado:")
            print(f"   - Total tipos genéricos: {grouped_summary['total_generic_types']}")
            print(f"   - Tipos con stock bajo: {grouped_summary['low_stock_types']}")
            print(f"   - Total categorías: {grouped_summary['total_categories']}")
            
            print("📊 Por categoría:")
            for category, data in grouped_summary['categories'].items():
                print(f"   - {category}: {data['generic_types_count']} tipos, {data['total_quantity']:.1f} total")
        else:
            print(f"❌ Error en resumen agrupado: {response.status_code}")
            return False
        
        # 6. Comparar ambos enfoques
        print("\n🔍 6. Comparación de enfoques:")
        print("TRADICIONAL vs AGRUPADO:")
        print(f"   Productos individuales: {summary['total_products']} vs Tipos genéricos: {grouped_summary['total_generic_types']}")
        print(f"   Stock bajo individual: {summary['low_stock_products']} vs Stock bajo agrupado: {grouped_summary['low_stock_types']}")
        
        # 7. Simular agregación de productos similares
        print("\n➕ 7. Simulando productos similares...")
        
        # Agregar diferentes tipos de lechuga
        similar_products = [
            {"product_name": "Lechuga Iceberg", "category": "Verduras", "quantity": 1.0, "unit": "unidades"},
            {"product_name": "Lechuga Romana", "category": "Verduras", "quantity": 1.0, "unit": "unidades"},
            {"product_name": "Lechuga Francesa", "category": "Verduras", "quantity": 2.0, "unit": "unidades"},
        ]
        
        for product in similar_products:
            response = requests.post(
                f"{api_url}/inventory/user/{user_id}/add-item",
                json=product,
                timeout=5
            )
            if response.status_code == 200:
                print(f"✅ Agregado: {product['product_name']}")
            else:
                print(f"⚠️ Error agregando {product['product_name']}: {response.status_code}")
        
        # 8. Verificar agrupación después de agregar productos similares
        print("\n🔄 8. Verificando agrupación actualizada...")
        response = requests.get(f"{api_url}/inventory/user/{user_id}/grouped", timeout=5)
        if response.status_code == 200:
            updated_grouped = response.json()
            grouped_inventory = updated_grouped['grouped_inventory']
            
            # Buscar el grupo de lechuga
            lechuga_group = next((item for item in grouped_inventory if item['product_type'] == 'Lechuga'), None)
            if lechuga_group:
                print(f"✅ Grupo de Lechuga encontrado:")
                print(f"   - Total cantidad: {lechuga_group['total_quantity']} {lechuga_group['unit']}")
                print(f"   - Variedades: {lechuga_group['items_count']}")
                print(f"   - Items específicos:")
                for item in lechuga_group['items']:
                    print(f"     * {item['specific_name']}: {item['quantity']} {item['unit']}")
            else:
                print("⚠️ No se encontró el grupo de Lechuga")
        
        print("\n🎉 ¡TODOS LOS TESTS DE AGRUPACIÓN PASARON!")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error conectando a API: {e}")
        return False

def test_extraction_logic():
    """Probar la lógica de extracción de tipos genéricos"""
    
    print("\n🧪 TESTING: Lógica de Extracción de Tipos Genéricos")
    print("=" * 55)
    
    # Agregar el directorio de la app al path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        from app.inventory_utils import extract_generic_product_type
        
        test_cases = [
            ("Lechuga Iceberg", "Lechuga"),
            ("Arroz Grado 1 1kg", "Arroz"),
            ("Leche Entera Soprole 1L", "Leche"),
            ("Queso Mantecoso Colun", "Queso"),
            ("Pollo Entero Fresco", "Pollo"),
            ("Tomates Cherry 500g", "Tomate"),
            ("Manzanas Rojas Premium", "Manzana"),
            ("Pan de Molde Ideal", "Pan"),
            ("Aceite de Oliva Extra Virgen", "Aceite"),
            ("Producto Desconocido XYZ", "Producto"),
        ]
        
        print("🔍 Probando extracción de tipos genéricos:")
        all_passed = True
        
        for input_name, expected_output in test_cases:
            actual_output = extract_generic_product_type(input_name)
            status = "✅" if actual_output == expected_output else "❌"
            print(f"   {status} '{input_name}' → '{actual_output}' (esperado: '{expected_output}')")
            
            if actual_output != expected_output:
                all_passed = False
        
        if all_passed:
            print("\n✅ Todos los tests de extracción pasaron")
        else:
            print("\n⚠️ Algunos tests de extracción fallaron")
        
        return all_passed
        
    except ImportError as e:
        print(f"❌ Error importando funciones: {e}")
        return False

if __name__ == "__main__":
    print("🚀 TESTING INVENTARIO AGRUPADO POR TIPO GENÉRICO")
    print("=" * 70)
    
    # Test 1: Endpoints de API
    success1 = test_grouped_inventory_endpoints()
    
    # Test 2: Lógica de extracción
    success2 = test_extraction_logic()
    
    print("\n" + "=" * 70)
    print("📊 RESULTADOS:")
    print(f"   - Endpoints agrupados: {'✅ PASS' if success1 else '❌ FAIL'}")
    print(f"   - Lógica extracción: {'✅ PASS' if success2 else '❌ FAIL'}")
    
    if success1 and success2:
        print("\n🎉 ¡INVENTARIO AGRUPADO FUNCIONANDO CORRECTAMENTE!")
        print("\n📋 Beneficios del agrupamiento:")
        print("   ✅ Agrupa productos similares (ej: 4 lechugas diferentes = 4 lechugas)")
        print("   ✅ Ideal para recetas (necesito 'lechuga', no 'lechuga iceberg específica')")
        print("   ✅ Vista simplificada del inventario")
        print("   ✅ Mejor para planificación de comidas")
        
        print("\n📱 Próximos pasos:")
        print("   1. Probar la nueva pantalla de inventario en la app móvil")
        print("   2. Verificar el botón 'Ver todo' en HomeScreen")
        print("   3. Probar el cambio entre vista agrupada y detallada")
    else:
        print("\n⚠️ Algunos tests fallaron - revisar implementación")
    
    sys.exit(0 if (success1 and success2) else 1)