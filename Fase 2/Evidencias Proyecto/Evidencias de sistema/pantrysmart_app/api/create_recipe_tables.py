"""
Script para crear las tablas de recetas en la base de datos
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db import SessionLocal, engine
from app.models import Base, Recipe, RecipeIngredient

def create_recipe_tables():
    """Crear las tablas de recetas si no existen"""
    
    print("🔧 Creando tablas de recetas...")
    
    try:
        # Crear todas las tablas definidas en los modelos
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas exitosamente!")
        
        # Verificar que las tablas se crearon
        db = SessionLocal()
        
        # Verificar tabla recipes
        result = db.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'recipes'"))
        recipes_exists = result.scalar() > 0
        
        # Verificar tabla recipe_ingredients
        result = db.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'recipe_ingredients'"))
        ingredients_exists = result.scalar() > 0
        
        print(f"📋 Tabla 'recipes': {'✅ Existe' if recipes_exists else '❌ No existe'}")
        print(f"📋 Tabla 'recipe_ingredients': {'✅ Existe' if ingredients_exists else '❌ No existe'}")
        
        if recipes_exists and ingredients_exists:
            print("🎉 Todas las tablas de recetas están listas!")
        else:
            print("⚠️ Algunas tablas no se crearon correctamente")
            
        db.close()
        
    except Exception as e:
        print(f"❌ Error al crear tablas: {e}")
        return False
        
    return True

def verify_recipe_structure():
    """Verificar la estructura de las tablas de recetas"""
    
    print("\n🔍 Verificando estructura de tablas...")
    
    db = SessionLocal()
    
    try:
        # Verificar estructura de recipes
        result = db.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'recipes' 
            ORDER BY ordinal_position
        """))
        
        print("\n📋 Estructura de tabla 'recipes':")
        for row in result:
            print(f"  - {row[0]}: {row[1]} ({'NULL' if row[2] == 'YES' else 'NOT NULL'})")
        
        # Verificar estructura de recipe_ingredients
        result = db.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'recipe_ingredients' 
            ORDER BY ordinal_position
        """))
        
        print("\n📋 Estructura de tabla 'recipe_ingredients':")
        for row in result:
            print(f"  - {row[0]}: {row[1]} ({'NULL' if row[2] == 'YES' else 'NOT NULL'})")
            
    except Exception as e:
        print(f"❌ Error al verificar estructura: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🍽️ Configurando tablas de recetas para PantrySmart")
    print("=" * 50)
    
    # Crear tablas
    if create_recipe_tables():
        # Verificar estructura
        verify_recipe_structure()
        print("\n✅ Configuración de recetas completada!")
    else:
        print("\n❌ Error en la configuración de recetas")
        sys.exit(1)