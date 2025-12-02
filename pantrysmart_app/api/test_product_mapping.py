#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Prueba para Sistema de Mapeo de Productos
==================================================

Este script te permite probar el sistema de mapeo con casos específicos
para asegurar que funcione perfectamente en tu demo.

Uso:
    python test_product_mapping.py
    python test_product_mapping.py --add-case "ARROZ GRADO 1" "Arroz"
"""

import sys
import os
import argparse
from typing import List, Tuple

# Agregar el directorio de la app al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.product_mapping import (
    normalize_product_name, 
    test_mapping, 
    DEMO_TEST_CASES,
    add_custom_mapping,
    get_mapping_stats
)

# ============================================================================
# CASOS DE PRUEBA ESPECÍFICOS PARA TU DEMO
# ============================================================================

DEMO_SPECIFIC_CASES = [
    # Casos que podrían aparecer en tu boleta de demo
    ("ARROZ TUCAPEL GRADO 1 1KG", "Arroz"),
    ("FIDEOS CAROZZI ESPAGUETI 400G", "Fideos"),
    ("LECHE SOPROLE ENTERA LARGA VIDA 1L", "Leche"),
    ("ACEITE CHEF VEGETAL 900ML", "Aceite"),
    ("ATUN VAN CAMPS EN AGUA 160G", "Atun"),
    ("QUESO CHANCO COLUN LAMINADO", "Queso"),
    ("PAN DE MOLDE IDEAL BLANCO", "Pan"),
    ("HUEVOS GALLINA DOCENA EXTRA", "Huevo"),
    ("CEBOLLA BLANCA A GRANEL KG", "Cebolla"),
    ("TOMATE REDONDO KG", "Tomate"),
    ("PECHUGA POLLO SIN HUESO KG", "Pollo"),
    ("AZUCAR GRANULADA IANSA 1KG", "Azucar"),
    ("HARINA SIN POLVOS SELECTA", "Harina"),
    ("SAL DE MESA LOBOS 1KG", "Sal"),
    ("YOGUR NATURAL SOPROLE 120G", "Yogur"),
    ("MANTEQUILLA CON SAL SOPROLE", "Mantequilla"),
    ("AJO NACIONAL KG", "Ajo"),
    ("ZANAHORIA A GRANEL KG", "Zanahoria"),
    ("SALSA DE TOMATE MAGGI", "Salsa de tomate"),
    ("SOPA MAGGI POLLO CON FIDEOS", "Sopa"),
    
    # Casos problemáticos comunes
    ("TUCAPEL ARROZ 1KG", "Arroz"),  # Marca primero
    ("CAROZZI TALLARINES", "Fideos"),  # Marca + tipo
    ("SOPROLE LECHE ENTERA", "Leche"),  # Marca + producto
    ("VAN CAMPS ATUN", "Atun"),  # Marca + producto
    ("CHEF ACEITE VEGETAL", "Aceite"),  # Marca + producto
    ("IDEAL PAN MOLDE", "Pan"),  # Marca + producto
    
    # Casos con errores de OCR simulados
    ("ARRQZ TUCAPEL", "Arroz"),  # Error de OCR
    ("FIDEDS CAROZZI", "Fideos"),  # Error de OCR
    ("LECHF SOPROLE", "Leche"),  # Error de OCR
    ("ATJN VAN CAMPS", "Atun"),  # Error de OCR
    
    # Casos con abreviaciones
    ("ARR TUCAPEL", "Arroz"),  # Abreviación
    ("FID CAROZZI", "Fideos"),  # Abreviación
    ("LCH SOPROLE", "Leche"),  # Abreviación (menos probable)
    
    # Casos con números y pesos
    ("ARROZ TUCAPEL 1000G", "Arroz"),
    ("FIDEOS CAROZZI 500GR", "Fideos"),
    ("LECHE SOPROLE 1000ML", "Leche"),
    ("ACEITE CHEF 900CC", "Aceite"),
    
    # Casos edge
    ("ARROZ", "Arroz"),  # Solo el producto
    ("FIDEOS", "Fideos"),  # Solo el producto
    ("LECHE", "Leche"),  # Solo el producto
    ("PAN", "Pan"),  # Solo el producto
]

# ============================================================================
# FUNCIONES DE TESTING
# ============================================================================

def run_basic_tests():
    """Ejecuta las pruebas básicas del sistema."""
    print("🧪 Ejecutando pruebas básicas del sistema de mapeo...")
    print("=" * 60)
    
    results = test_mapping(DEMO_TEST_CASES)
    
    print(f"📊 RESULTADOS BÁSICOS:")
    print(f"   Total casos: {results['total_tests']}")
    print(f"   Exitosos: {results['passed']} ✅")
    print(f"   Fallidos: {results['failed']} ❌")
    print(f"   Precisión: {results['accuracy']:.1%}")
    
    if results['failed'] > 0:
        print(f"\n❌ CASOS FALLIDOS:")
        for detail in results['details']:
            if not detail['passed']:
                print(f"   '{detail['input']}' -> Esperado: '{detail['expected']}', Obtenido: '{detail['actual']}'")
    
    return results['accuracy'] >= 0.9  # 90% de precisión mínima

def run_demo_specific_tests():
    """Ejecuta pruebas específicas para la demo."""
    print("\n🎯 Ejecutando pruebas específicas para DEMO...")
    print("=" * 60)
    
    results = test_mapping(DEMO_SPECIFIC_CASES)
    
    print(f"📊 RESULTADOS DEMO:")
    print(f"   Total casos: {results['total_tests']}")
    print(f"   Exitosos: {results['passed']} ✅")
    print(f"   Fallidos: {results['failed']} ❌")
    print(f"   Precisión: {results['accuracy']:.1%}")
    
    if results['failed'] > 0:
        print(f"\n❌ CASOS FALLIDOS EN DEMO:")
        failed_cases = []
        for detail in results['details']:
            if not detail['passed']:
                failed_cases.append(detail)
                print(f"   '{detail['input']}' -> Esperado: '{detail['expected']}', Obtenido: '{detail['actual']}'")
        
        # Sugerencias de corrección
        if failed_cases:
            print(f"\n💡 SUGERENCIAS DE CORRECCIÓN:")
            for case in failed_cases:
                print(f"   add_custom_mapping('{case['input']}', '{case['expected']}')")
    
    return results['accuracy'] >= 0.95  # 95% de precisión para demo

def test_individual_product(product_name: str):
    """Prueba un producto individual."""
    print(f"\n🔍 Probando producto individual: '{product_name}'")
    print("-" * 40)
    
    result = normalize_product_name(product_name)
    print(f"   Resultado: '{result}'")
    
    # Mostrar proceso de decisión
    from app.product_mapping import clean_text, extract_keywords
    cleaned = clean_text(product_name)
    keywords = extract_keywords(product_name)
    
    print(f"   Texto limpio: '{cleaned}'")
    print(f"   Palabras clave: {keywords}")
    
    return result

def show_mapping_stats():
    """Muestra estadísticas del sistema de mapeo."""
    print("\n📈 ESTADÍSTICAS DEL SISTEMA DE MAPEO:")
    print("=" * 50)
    
    stats = get_mapping_stats()
    print(f"   Total mapeos: {stats['total_mappings']}")
    print(f"   Tipos únicos: {stats['unique_types']}")
    
    print(f"\n📋 DISTRIBUCIÓN POR TIPO:")
    for product_type, count in sorted(stats['type_distribution'].items(), key=lambda x: x[1], reverse=True):
        print(f"   {product_type}: {count} mapeos")

def interactive_test():
    """Modo interactivo para probar productos."""
    print("\n🎮 MODO INTERACTIVO")
    print("=" * 30)
    print("Escribe nombres de productos para probar el mapeo.")
    print("Escribe 'quit' para salir.\n")
    
    while True:
        try:
            product_name = input("Producto: ").strip()
            if product_name.lower() in ['quit', 'exit', 'q']:
                break
            if not product_name:
                continue
                
            result = test_individual_product(product_name)
            
        except KeyboardInterrupt:
            print("\n\n👋 ¡Hasta luego!")
            break

def add_demo_mapping(original: str, canonical: str):
    """Agrega un mapeo personalizado para la demo."""
    success = add_custom_mapping(original, canonical)
    if success:
        print(f"✅ Mapeo agregado: '{original}' -> '{canonical}'")
        
        # Verificar que funciona
        test_result = normalize_product_name(original)
        if test_result == canonical:
            print(f"✅ Verificación exitosa: '{original}' -> '{test_result}'")
        else:
            print(f"❌ Error en verificación: '{original}' -> '{test_result}' (esperado: '{canonical}')")
    else:
        print(f"❌ Error: '{canonical}' no es un tipo válido")

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Prueba el sistema de mapeo de productos")
    parser.add_argument('--demo-only', action='store_true', help='Solo ejecutar pruebas de demo')
    parser.add_argument('--interactive', action='store_true', help='Modo interactivo')
    parser.add_argument('--stats', action='store_true', help='Mostrar estadísticas')
    parser.add_argument('--test-product', type=str, help='Probar un producto específico')
    parser.add_argument('--add-case', nargs=2, metavar=('ORIGINAL', 'CANONICAL'), 
                       help='Agregar mapeo personalizado')
    
    args = parser.parse_args()
    
    print("🚀 SISTEMA DE MAPEO DE PRODUCTOS - PANTRYSMART")
    print("=" * 60)
    
    # Mostrar estadísticas si se solicita
    if args.stats:
        show_mapping_stats()
    
    # Agregar mapeo personalizado
    if args.add_case:
        add_demo_mapping(args.add_case[0], args.add_case[1])
        return
    
    # Probar producto específico
    if args.test_product:
        test_individual_product(args.test_product)
        return
    
    # Modo interactivo
    if args.interactive:
        interactive_test()
        return
    
    # Ejecutar pruebas
    all_passed = True
    
    if not args.demo_only:
        basic_passed = run_basic_tests()
        all_passed = all_passed and basic_passed
    
    demo_passed = run_demo_specific_tests()
    all_passed = all_passed and demo_passed
    
    # Resumen final
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ¡TODAS LAS PRUEBAS PASARON! El sistema está listo para la demo.")
        print("\n💡 Consejos para la demo:")
        print("   1. Usa boletas con productos comunes (arroz, fideos, leche)")
        print("   2. Asegúrate de que la imagen sea clara y bien iluminada")
        print("   3. Si algo falla, puedes agregar mapeos con --add-case")
    else:
        print("⚠️ ALGUNAS PRUEBAS FALLARON. Revisa los casos arriba.")
        print("\n🔧 Para corregir:")
        print("   1. Ejecuta: python test_product_mapping.py --add-case 'PRODUCTO' 'TIPO'")
        print("   2. O modifica directamente el archivo product_mapping.py")
    
    print(f"\n📞 Para ayuda: python test_product_mapping.py --help")

if __name__ == "__main__":
    main()