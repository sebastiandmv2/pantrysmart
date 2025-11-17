#!/usr/bin/env python3
"""
Script para probar específicamente el endpoint de resumen que está fallando
"""

import os
import sys
import requests

def test_summary_endpoint_step_by_step():
    """Probar el endpoint de resumen paso a paso"""
    
    print("🔍 TESTING: Endpoint de Resumen - Paso a Paso")
    print("=" * 50)
    
    # Usar la URL de tu túnel
    api_url = "https://least-rent-societies-rendered.trycloudflare.com"
    user_id = "demo-user"
    
    try:
        # Paso 1: Health check
        print("1. 🏥 Probando health check...")
        response = requests.get(f"{api_url}/health", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Health check OK")
        else:
            print("   ❌ Health check falló")
            return False
        
        # Paso 2: Probar endpoint de resumen
        print(f"\n2. 📊 Probando endpoint de resumen para usuario: {user_id}")
        response = requests.get(f"{api_url}/inventory/user/{user_id}/summary", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Resumen obtenido exitosamente:")
            print(f"      - Total productos: {data.get('total_products', 'N/A')}")
            print(f"      - Total categorías: {data.get('total_categories', 'N/A')}")
            print(f"      - Stock bajo: {data.get('low_stock_products', 'N/A')}")
            return True
        else:
            print(f"   ❌ Error {response.status_code}")
            try:
                error_detail = response.text
                print(f"   Error detail: {error_detail}")
            except:
                print("   No se pudo obtener detalle del error")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        return False

def test_database_directly():
    """Probar la base de datos directamente"""
    
    print("\n🔍 TESTING: Base de Datos Directamente")
    print("=" * 40)
    
    # Agregar el directorio de la app al path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from app.models import UserInventory, Product
        from app.inventory_utils import get_user_inventory_summary
        
        # Configurar base de datos
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("❌ DATABASE_URL no está definido")
            return False
        
        print("🔗 Conectando a base de datos...")
        engine = create_engine(database_url, pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        db = SessionLocal()
        
        # Verificar datos básicos
        print("📊 Verificando datos básicos...")
        
        total_inventory = db.query(UserInventory).count()
        demo_inventory = db.query(UserInventory).filter(UserInventory.user_id == "demo-user").count()
        total_products = db.query(Product).count()
        
        print(f"   - Total items de inventario: {total_inventory}")
        print(f"   - Items del usuario demo: {demo_inventory}")
        print(f"   - Total productos en catálogo: {total_products}")
        
        # Probar función directamente
        print("\n🧪 Probando función get_user_inventory_summary...")
        try:
            summary = get_user_inventory_summary(db, "demo-user")
            print("✅ Función ejecutada exitosamente:")
            print(f"   - Total productos: {summary['total_products']}")
            print(f"   - Total categorías: {summary['total_categories']}")
            print(f"   - Stock bajo: {summary['low_stock_products']}")
        except Exception as e:
            print(f"❌ Error en función: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return False
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        return False

def add_sample_data():
    """Agregar datos de muestra si no existen"""
    
    print("\n📦 AGREGANDO DATOS DE MUESTRA...")
    
    api_url = "https://least-rent-societies-rendered.trycloudflare.com"
    
    try:
        response = requests.post(f"{api_url}/inventory/demo/add-sample-data", timeout=15)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data.get('items_added', 0)} productos agregados")
            return True
        else:
            print(f"❌ Error agregando datos: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 DIAGNÓSTICO DEL ERROR 500 EN RESUMEN")
    print("=" * 60)
    
    # Test 1: Probar endpoint directamente
    print("PASO 1: Probando endpoint...")
    endpoint_works = test_summary_endpoint_step_by_step()
    
    if not endpoint_works:
        print("\nPASO 2: Agregando datos de muestra...")
        add_sample_data()
        
        print("\nPASO 3: Probando endpoint nuevamente...")
        endpoint_works = test_summary_endpoint_step_by_step()
    
    if not endpoint_works:
        print("\nPASO 4: Probando base de datos directamente...")
        db_works = test_database_directly()
        
        if db_works:
            print("\n🤔 La BD funciona pero el endpoint no...")
            print("💡 Posible problema en el servidor API")
        else:
            print("\n🔍 Problema en la base de datos")
    
    print("\n" + "=" * 60)
    if endpoint_works:
        print("🎉 ¡ENDPOINT FUNCIONANDO!")
    else:
        print("⚠️ ENDPOINT SIGUE FALLANDO")
        print("\n📋 Próximos pasos:")
        print("   1. Revisar logs del servidor API")
        print("   2. Verificar configuración de base de datos")
        print("   3. Reiniciar el servidor")