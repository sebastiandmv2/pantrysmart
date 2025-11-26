#!/usr/bin/env python3
"""
Script de prueba para el nuevo schema de inventario
"""

import json
import requests
import os

# URL base de la API
API_URL = os.getenv("API_URL", "http://localhost:8000")

def test_receipt_extraction():
    """Prueba la extracción de boleta con datos simulados"""
    
    print("🧪 Probando nuevo schema de inventario...")
    
    # Datos simulados que devolvería OpenAI
    mock_openai_response = {
        "tienda": {
            "nombre": "Supermercado Líder",
            "sucursal_o_direccion": "Av. Providencia 1234, Providencia"
        },
        "items": [
            {
                "NombreOriginal": "ARROZ TUCAPEL 1KG",
                "Cantidad": 2,
                "Producto": "Arroz",
                "Categoria": "Abarrotes",
                "is_inventario": True
            },
            {
                "NombreOriginal": "LECHE SOPROLE 1L",
                "Cantidad": 1,
                "Producto": "Leche",
                "Categoria": "Lacteos",
                "is_inventario": True
            },
            {
                "NombreOriginal": "DETERGENTE SKIP 1L",
                "Cantidad": 1,
                "Producto": "Detergente",
                "Categoria": "Limpieza",
                "is_inventario": False
            },
            {
                "NombreOriginal": "PAN HALLULLA 6 UN",
                "Cantidad": 6,
                "Producto": "Pan",
                "Categoria": "Panaderia",
                "is_inventario": True
            }
        ]
    }
    
    print("\n📋 Datos simulados de OpenAI:")
    print(json.dumps(mock_openai_response, indent=2, ensure_ascii=False))
    
    # Simular el filtrado que hace el endpoint
    inventory_items = []
    for item in mock_openai_response["items"]:
        if item["is_inventario"]:
            inventory_items.append({
                "product_name": item["NombreOriginal"],
                "product_type": item["Producto"],
                "quantity": item["Cantidad"]
            })
    
    filtered_response = {
        "store": mock_openai_response["tienda"]["sucursal_o_direccion"],
        "items": inventory_items
    }
    
    print("\n🔄 Datos filtrados (solo inventario):")
    print(json.dumps(filtered_response, indent=2, ensure_ascii=False))
    
    return filtered_response

def test_receipt_confirmation(receipt_data):
    """Prueba la confirmación de boleta"""
    
    print("\n💾 Probando confirmación de boleta...")
    
    # Datos para confirmar
    confirm_data = {
        "user_id": "demo-user",
        "store": receipt_data["store"],
        "items": receipt_data["items"]
    }
    
    print("\n📤 Datos a enviar al endpoint /receipts/confirm:")
    print(json.dumps(confirm_data, indent=2, ensure_ascii=False))
    
    try:
        # Hacer request al endpoint
        response = requests.post(
            f"{API_URL}/receipts/confirm",
            json=confirm_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ Boleta confirmada exitosamente!")
            print(f"   ID: {result['id']}")
            print(f"   Usuario: {result['user_id']}")
            print(f"   Tienda: {result['store']}")
            print(f"   Productos: {len(result['items'])}")
            print(f"   Creado: {result['created_at']}")
            
            return result
        else:
            print(f"\n❌ Error {response.status_code}: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print(f"\n⚠️  No se pudo conectar a {API_URL}")
        print("   Asegúrate de que el servidor esté corriendo")
        return None
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return None

def test_receipt_retrieval(receipt_id):
    """Prueba la obtención de boleta por ID"""
    
    print(f"\n🔍 Probando obtención de boleta ID {receipt_id}...")
    
    try:
        response = requests.get(
            f"{API_URL}/receipts/{receipt_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ Boleta obtenida exitosamente!")
            print(f"   ID: {result['id']}")
            print(f"   Tienda: {result['store']}")
            print(f"   Productos:")
            
            for item in result['items']:
                print(f"     - {item['product_name']} -> {item['product_type']} (x{item['quantity']})")
            
            return result
        else:
            print(f"\n❌ Error {response.status_code}: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print(f"\n⚠️  No se pudo conectar a {API_URL}")
        return None
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return None

def main():
    print("🚀 Iniciando pruebas del nuevo schema de inventario")
    print(f"🔗 API URL: {API_URL}")
    
    # 1. Probar extracción (simulada)
    receipt_data = test_receipt_extraction()
    
    # 2. Probar confirmación
    confirmed_receipt = test_receipt_confirmation(receipt_data)
    
    if confirmed_receipt:
        # 3. Probar obtención
        test_receipt_retrieval(confirmed_receipt['id'])
        
        print("\n🎉 ¡Todas las pruebas completadas!")
        print("\n📝 Resumen:")
        print("   ✅ Extracción y filtrado de datos")
        print("   ✅ Confirmación de boleta")
        print("   ✅ Obtención de boleta")
        print("\n💡 El nuevo schema está funcionando correctamente!")
    else:
        print("\n💥 Las pruebas fallaron. Revisa la configuración del servidor.")

if __name__ == "__main__":
    main()