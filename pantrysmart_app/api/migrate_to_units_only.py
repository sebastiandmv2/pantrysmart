#!/usr/bin/env python3
"""
Script de migración completa para simplificar el sistema a solo unidades enteras
Este script hace toda la migración en un solo paso
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Cargar variables de entorno
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import Recipe, RecipeIngredient, Product, UserInventory, InventoryMovement

def migrate_to_units_only():
    """Migración completa a sistema de unidades simplificado"""
    db = SessionLocal()
    
    try:
        print("🚀 INICIANDO MIGRACIÓN A SISTEMA SIMPLIFICADO DE UNIDADES")
        print("=" * 60)
        
        # 1. Actualizar productos existentes
        print("📦 1. Actualizando productos...")
        products = db.query(Product).all()
        for product in products:
            product.default_unit = "unidades"
            product.is_perishable = False
            product.typical_shelf_life_days = None
        print(f"   ✅ Actualizados {len(products)} productos")
        
        # 2. Actualizar inventario existente
        print("📋 2. Actualizando inventario...")
        inventory_items = db.query(UserInventory).all()
        for item in inventory_items:
            # Convertir cantidad a entero (redondeando hacia arriba si es necesario)
            import math
            item.current_quantity = float(max(1, math.ceil(item.current_quantity)))
            item.unit = "unidades"
            item.purchase_date = None
            item.expiration_date = None
            item.purchase_price = None
            item.min_stock_alert = 1.0
        print(f"   ✅ Actualizados {len(inventory_items)} items de inventario")
        
        # 3. Actualizar movimientos existentes
        print("📈 3. Actualizando movimientos...")
        movements = db.query(InventoryMovement).all()
        for movement in movements:
            import math
            # Convertir cantidades a enteros
            movement.quantity_change = float(max(1, math.ceil(abs(movement.quantity_change))) * (1 if movement.quantity_change >= 0 else -1))
            movement.quantity_before = float(max(0, math.ceil(movement.quantity_before)))
            movement.quantity_after = float(max(0, math.ceil(movement.quantity_after)))
            movement.unit = "unidades"
            movement.cost_per_unit = None
            movement.total_cost = None
        print(f"   ✅ Actualizados {len(movements)} movimientos")
        
        # 4. Eliminar recetas existentes (serán recreadas)
        print("🍳 4. Eliminando recetas existentes...")
        deleted_ingredients = db.query(RecipeIngredient).delete()
        deleted_recipes = db.query(Recipe).delete()
        print(f"   ✅ Eliminados {deleted_ingredients} ingredientes y {deleted_recipes} recetas")
        
        # 5. Confirmar cambios
        db.commit()
        print("\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE!")
        print("=" * 60)
        print("✅ Productos actualizados a 'unidades'")
        print("✅ Inventario convertido a enteros")
        print("✅ Movimientos simplificados")
        print("✅ Recetas eliminadas (listas para recrear)")
        print("\n🔄 Ejecuta ahora: python populate_recipes.py")
        
    except Exception as e:
        print(f"❌ ERROR durante la migración: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("⚠️  ADVERTENCIA: Este script modificará la base de datos")
    print("   - Convertirá todas las cantidades a enteros")
    print("   - Cambiará todas las unidades a 'unidades'")
    print("   - Eliminará las recetas existentes")
    print()
    
    confirm = input("¿Continuar? (escribe 'SI' para confirmar): ")
    if confirm.upper() == 'SI':
        migrate_to_units_only()
    else:
        print("❌ Migración cancelada")