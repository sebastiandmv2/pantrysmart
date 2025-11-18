#!/usr/bin/env python3
"""
Script para actualizar las recetas existentes a usar solo unidades enteras
Elimina las recetas actuales y las recrea con el nuevo formato simplificado
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import Recipe, RecipeIngredient, Product

def update_recipes_to_units():
    """Actualizar recetas para usar solo unidades enteras"""
    db = SessionLocal()
    
    try:
        print("🔄 Iniciando actualización de recetas a unidades simplificadas...")
        
        # 1. Eliminar todas las recetas existentes
        print("🗑️  Eliminando recetas existentes...")
        deleted_ingredients = db.query(RecipeIngredient).delete()
        deleted_recipes = db.query(Recipe).delete()
        print(f"   - Eliminados {deleted_ingredients} ingredientes")
        print(f"   - Eliminadas {deleted_recipes} recetas")
        
        # 2. Actualizar productos existentes para usar solo unidades
        print("🔧 Actualizando productos existentes...")
        products = db.query(Product).all()
        for product in products:
            product.default_unit = "unidades"
            product.is_perishable = False  # Simplificar para POC
            product.typical_shelf_life_days = None
        
        updated_products = len(products)
        print(f"   - Actualizados {updated_products} productos")
        
        # 3. Confirmar cambios
        db.commit()
        print("✅ Base de datos actualizada exitosamente!")
        
        print("\n🚀 Ahora ejecuta 'python populate_recipes.py' para crear las recetas simplificadas")
        
    except Exception as e:
        print(f"❌ Error durante la actualización: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_recipes_to_units()