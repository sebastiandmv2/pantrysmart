#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Preparación para DEMO - PantrySmart
============================================

Este script prepara y verifica que todo esté listo para tu demo oficial.
Ejecuta esto antes de tu presentación para asegurar que el reconocimiento
de boletas funcione perfectamente.

Uso:
    python prepare_demo.py
    python prepare_demo.py --fix-issues
    python prepare_demo.py --add-products products.txt
"""

import sys
import os
import argparse
import requests
import json
from typing import List, Dict, Any

# Agregar el directorio de la app al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.product_mapping import normalize_product_name, test_mapping, get_mapping_stats
from demo_products_config import apply_demo_mappings, test_demo_products, DEMO_TEST_PRODUCTS

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

API_BASE_URL = "http://localhost:8000"
DEMO_PRODUCTS_FILE = "demo_products.txt"

# Productos críticos que DEBEN funcionar en tu demo
CRITICAL_PRODUCTS = [
    "ARROZ TUCAPEL 1KG",
    "FIDEOS CAROZZI ESPAGUETI", 
    "LECHE SOPROLE ENTERA",
    "ACEITE CHEF VEGETAL",
    "ATUN VAN CAMPS",
    "QUESO CHANCO",
    "PAN DE MOLDE",
    "HUEVOS GALLINA",
    "CEBOLLA BLANCA",
    "TOMATE REDONDO",
    "POLLO PECHUGA",
    "YOGUR NATURAL",
]

# ============================================================================
# FUNCIONES DE VERIFICACIÓN
# ============================================================================

def check_api_connection() -> bool:
    """Verifica que la API esté funcionando."""
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def test_mapping_endpoint() -> Dict[str, Any]:
    """Prueba el endpoint de mapeo."""
    try:
        test_product = "ARROZ TUCAPEL 1KG"
        response = requests.post(
            f"{API_BASE_URL}/receipts/test-mapping",
            params={"product_name": test_product},
            timeout=10
        )
        if response.status_code == 200:
            return {"success": True, "data": response.json()}
        else:
            return {"success": False, "error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def test_critical_products() -> Dict[str, Any]:
    """Prueba todos los productos críticos."""
    results = {
        "total": len(CRITICAL_PRODUCTS),
        "passed": 0,
        "failed": 0,
        "failed_products": [],
        "details": []
    }
    
    for product in CRITICAL_PRODUCTS:
        mapped_type = normalize_product_name(product)
        passed = mapped_type != "Otros"
        
        result_detail = {
            "product": product,
            "mapped_type": mapped_type,
            "passed": passed
        }
        
        results["details"].append(result_detail)
        
        if passed:
            results["passed"] += 1
        else:
            results["failed"] += 1
            results["failed_products"].append(product)
    
    results["success_rate"] = (results["passed"] / results["total"]) * 100
    return results

def check_openai_config() -> bool:
    """Verifica que OpenAI esté configurado."""
    api_key = os.getenv("OPENAI_API_KEY")
    return api_key is not None and len(api_key) > 10

# ============================================================================
# FUNCIONES DE CORRECCIÓN
# ============================================================================

def fix_failed_products(failed_products: List[str]) -> bool:
    """Intenta corregir productos que fallan."""
    print(f"\n🔧 Intentando corregir {len(failed_products)} productos...")
    
    # Mapeos de emergencia para productos comunes
    emergency_mappings = {
        "arroz": "Arroz",
        "fideos": "Fideos", 
        "leche": "Leche",
        "aceite": "Aceite",
        "atun": "Atun",
        "queso": "Queso",
        "pan": "Pan",
        "huevos": "Huevo",
        "cebolla": "Cebolla",
        "tomate": "Tomate",
        "pollo": "Pollo",
        "yogur": "Yogur",
    }
    
    fixed_count = 0
    for product in failed_products:
        # Buscar palabra clave en el producto
        product_lower = product.lower()
        for keyword, canonical_type in emergency_mappings.items():
            if keyword in product_lower:
                try:
                    # Agregar mapeo usando la API
                    response = requests.post(
                        f"{API_BASE_URL}/receipts/add-mapping",
                        params={
                            "original_text": product,
                            "canonical_type": canonical_type
                        },
                        timeout=5
                    )
                    if response.status_code == 200:
                        print(f"   ✅ Corregido: '{product}' -> '{canonical_type}'")
                        fixed_count += 1
                        break
                    else:
                        print(f"   ❌ Error corrigiendo '{product}': HTTP {response.status_code}")
                except Exception as e:
                    print(f"   ❌ Error corrigiendo '{product}': {e}")
    
    print(f"\n📊 Productos corregidos: {fixed_count}/{len(failed_products)}")
    return fixed_count > 0

def load_products_from_file(filename: str) -> List[str]:
    """Carga productos desde un archivo de texto."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            products = [line.strip() for line in f if line.strip()]
        return products
    except FileNotFoundError:
        print(f"❌ Archivo no encontrado: {filename}")
        return []
    except Exception as e:
        print(f"❌ Error leyendo archivo: {e}")
        return []

# ============================================================================
# FUNCIONES DE REPORTE
# ============================================================================

def print_system_status():
    """Imprime el estado general del sistema."""
    print("🔍 VERIFICANDO ESTADO DEL SISTEMA")
    print("=" * 50)
    
    # 1. Conexión API
    api_connected = check_api_connection()
    print(f"   API Conectada: {'✅' if api_connected else '❌'}")
    
    if not api_connected:
        print("   💡 Solución: Ejecuta 'make up' para levantar la API")
        return False
    
    # 2. OpenAI configurado
    openai_configured = check_openai_config()
    print(f"   OpenAI Configurado: {'✅' if openai_configured else '❌'}")
    
    if not openai_configured:
        print("   💡 Solución: Configura OPENAI_API_KEY en tu .env")
        return False
    
    # 3. Endpoint de mapeo
    mapping_test = test_mapping_endpoint()
    print(f"   Endpoint de Mapeo: {'✅' if mapping_test['success'] else '❌'}")
    
    if not mapping_test['success']:
        print(f"   💡 Error: {mapping_test.get('error', 'Desconocido')}")
        return False
    
    # 4. Estadísticas de mapeo
    stats = get_mapping_stats()
    print(f"   Mapeos Disponibles: {stats['total_mappings']}")
    print(f"   Tipos Únicos: {stats['unique_types']}")
    
    return True

def print_demo_readiness():
    """Imprime el estado de preparación para la demo."""
    print("\n🎯 VERIFICANDO PREPARACIÓN PARA DEMO")
    print("=" * 50)
    
    # Aplicar mapeos específicos de demo
    apply_demo_mappings()
    
    # Probar productos críticos
    results = test_critical_products()
    
    print(f"   Productos Críticos: {results['passed']}/{results['total']} ✅")
    print(f"   Tasa de Éxito: {results['success_rate']:.1f}%")
    
    if results['failed'] > 0:
        print(f"\n❌ PRODUCTOS QUE FALLAN:")
        for product in results['failed_products']:
            print(f"   • {product}")
        
        return False, results['failed_products']
    
    return True, []

def generate_demo_report():
    """Genera un reporte completo para la demo."""
    print("\n📋 REPORTE COMPLETO DE DEMO")
    print("=" * 50)
    
    # Información del sistema
    stats = get_mapping_stats()
    print(f"📊 ESTADÍSTICAS DEL SISTEMA:")
    print(f"   • Total de mapeos: {stats['total_mappings']}")
    print(f"   • Tipos canónicos cubiertos: {stats['unique_types']}")
    print(f"   • Cobertura: {(stats['unique_types'] / 25) * 100:.1f}%")  # 25 tipos totales
    
    # Top productos mapeados
    print(f"\n🏆 TOP TIPOS DE PRODUCTOS:")
    sorted_types = sorted(stats['type_distribution'].items(), key=lambda x: x[1], reverse=True)
    for i, (product_type, count) in enumerate(sorted_types[:10]):
        print(f"   {i+1:2d}. {product_type}: {count} mapeos")
    
    # Productos de prueba
    demo_ready = test_demo_products()
    print(f"\n🎯 PRODUCTOS DE DEMO: {'✅ LISTO' if demo_ready else '⚠️ NECESITA ATENCIÓN'}")
    
    # Recomendaciones
    print(f"\n💡 RECOMENDACIONES PARA LA DEMO:")
    print(f"   1. Usa boletas con productos comunes (arroz, fideos, leche)")
    print(f"   2. Asegúrate de que la imagen sea clara y bien iluminada")
    print(f"   3. Ten preparado el endpoint /receipts/add-mapping para correcciones")
    print(f"   4. Muestra las estadísticas con /receipts/mapping-stats")
    print(f"   5. Si algo falla, usa /receipts/test-mapping para debugging")

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Prepara el sistema para la demo")
    parser.add_argument('--fix-issues', action='store_true', 
                       help='Intenta corregir automáticamente productos que fallan')
    parser.add_argument('--add-products', type=str, 
                       help='Archivo con productos adicionales para probar')
    parser.add_argument('--report-only', action='store_true',
                       help='Solo genera el reporte, no hace verificaciones')
    parser.add_argument('--critical-only', action='store_true',
                       help='Solo verifica productos críticos')
    
    args = parser.parse_args()
    
    print("🚀 PREPARACIÓN PARA DEMO - PANTRYSMART")
    print("=" * 60)
    
    # Solo reporte
    if args.report_only:
        generate_demo_report()
        return
    
    # Verificar sistema
    system_ready = print_system_status()
    if not system_ready:
        print("\n❌ SISTEMA NO ESTÁ LISTO")
        print("   Corrige los problemas arriba antes de continuar.")
        sys.exit(1)
    
    # Verificar demo
    demo_ready, failed_products = print_demo_readiness()
    
    # Cargar productos adicionales si se especifica
    if args.add_products:
        additional_products = load_products_from_file(args.add_products)
        if additional_products:
            print(f"\n📁 Probando {len(additional_products)} productos adicionales...")
            for product in additional_products:
                mapped_type = normalize_product_name(product)
                if mapped_type == "Otros":
                    failed_products.append(product)
                    print(f"   ❌ {product} -> {mapped_type}")
                else:
                    print(f"   ✅ {product} -> {mapped_type}")
    
    # Intentar corregir si se solicita
    if args.fix_issues and failed_products:
        fixes_applied = fix_failed_products(failed_products)
        if fixes_applied:
            print("\n🔄 Re-verificando después de las correcciones...")
            demo_ready, remaining_failed = print_demo_readiness()
            failed_products = remaining_failed
    
    # Resultado final
    print("\n" + "=" * 60)
    if demo_ready and not failed_products:
        print("🎉 ¡SISTEMA LISTO PARA LA DEMO!")
        print("\n✅ CHECKLIST FINAL:")
        print("   • API funcionando correctamente")
        print("   • OpenAI configurado")
        print("   • Todos los productos críticos mapeados")
        print("   • Endpoints de debugging disponibles")
        print("\n🎯 COMANDOS ÚTILES DURANTE LA DEMO:")
        print("   • Probar producto: curl -X POST 'localhost:8000/receipts/test-mapping?product_name=ARROZ'")
        print("   • Agregar mapeo: curl -X POST 'localhost:8000/receipts/add-mapping?original_text=PRODUCTO&canonical_type=Tipo'")
        print("   • Ver estadísticas: curl localhost:8000/receipts/mapping-stats")
    else:
        print("⚠️ SISTEMA NECESITA ATENCIÓN")
        if failed_products:
            print(f"\n❌ {len(failed_products)} productos aún fallan:")
            for product in failed_products[:10]:  # Mostrar solo los primeros 10
                print(f"   • {product}")
            if len(failed_products) > 10:
                print(f"   ... y {len(failed_products) - 10} más")
        
        print(f"\n🔧 PARA CORREGIR:")
        print(f"   1. Ejecuta: python prepare_demo.py --fix-issues")
        print(f"   2. O agrega mapeos manualmente en demo_products_config.py")
        print(f"   3. O usa la API durante la demo para corregir en tiempo real")
    
    # Generar reporte final
    if not args.critical_only:
        generate_demo_report()

if __name__ == "__main__":
    main()