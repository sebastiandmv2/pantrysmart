"""
Script para poblar la base de datos con recetas chilenas populares
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models import Recipe, RecipeIngredient, Product, ProductCategory, Base

# Crear todas las tablas
Base.metadata.create_all(bind=engine)

def get_or_create_product(db: Session, name: str, category: ProductCategory, unit: str = "unidades"):
    """Obtener o crear un producto"""
    product = db.query(Product).filter(Product.name == name).first()
    if not product:
        product = Product(
            name=name,
            category=category,
            default_unit=unit,
            is_perishable=category in [ProductCategory.CARNES, ProductCategory.LACTEOS, 
                                     ProductCategory.VERDURAS, ProductCategory.FRUTAS]
        )
        db.add(product)
        db.flush()
    return product

def populate_recipes():
    db = SessionLocal()
    
    try:
        # Mapeo de nombres de recetas a archivos de imagen
        image_mapping = {
            "Empanadas de Pino": "empanadas-pino.jpg",
            "Pastel de Choclo": "pastel-choclo.jpeg", 
            "Cazuela de Pollo": "cazuela-pollo.jpg",
            "Completo Italiano": "completo-italiano.jpg",
            "Porotos con Riendas": "porotos-rienda.jpg",
            "Arroz con Pollo": "arroz-pollo.jpg",
            "Charquicán": "charquican.jpg",
            "Sopaipillas": "sopaipillas.jpg",
            "Lomo a lo Pobre": "lomo-pobre.jpg",
            "Pan Amasado": "pan-amasado.jpeg"
        }
        
        # Recetas chilenas populares con ingredientes esenciales
        recipes_data = [
            {
                "name": "Empanadas de Pino",
                "description": "Clásicas empanadas chilenas rellenas de carne, cebolla y huevo",
                "difficulty": "intermedio",
                "prep_time": 45,
                "cook_time": 25,
                "servings": 8,
                "instructions": """1. Picar la cebolla en cubos pequeños y sofreír hasta dorar
2. Agregar la carne molida y cocinar hasta que esté bien dorada
3. Condimentar y dejar enfriar
4. Extender la masa, rellenar con pino, huevo duro y aceitunas
5. Cerrar las empanadas y pintar con huevo batido
6. Hornear a 200°C por 20-25 minutos hasta dorar""",
                "tags": "tradicional,chileno,horno",
                "ingredients": [
                    ("Carne molida", ProductCategory.CARNES, 500, "gramos"),
                    ("Cebolla", ProductCategory.VERDURAS, 2, "unidades"),
                    ("Huevo", ProductCategory.LACTEOS, 3, "unidades"),
                    ("Harina", ProductCategory.ABARROTES, 500, "gramos"),
                    ("Aceite", ProductCategory.ABARROTES, 100, "ml")
                ]
            },
            {
                "name": "Pastel de Choclo",
                "description": "Tradicional pastel chileno con choclo, carne y pollo",
                "difficulty": "intermedio", 
                "prep_time": 60,
                "cook_time": 30,
                "servings": 6,
                "instructions": """1. Preparar el pino con carne molida y cebolla
2. Cocinar el pollo en trozos y sazonar
3. Moler el choclo hasta obtener una pasta
4. En una fuente, hacer capas: pino, pollo, huevos duros
5. Cubrir con la pasta de choclo y azúcar
6. Hornear hasta dorar la superficie""",
                "tags": "tradicional,chileno,verano",
                "ingredients": [
                    ("Carne molida", ProductCategory.CARNES, 400, "gramos"),
                    ("Pollo", ProductCategory.CARNES, 300, "gramos"),
                    ("Cebolla", ProductCategory.VERDURAS, 2, "unidades"),
                    ("Huevo", ProductCategory.LACTEOS, 3, "unidades"),
                    ("Leche", ProductCategory.LACTEOS, 200, "ml")
                ]
            },
            {
                "name": "Cazuela de Pollo",
                "description": "Sopa tradicional chilena con pollo y verduras",
                "difficulty": "facil",
                "prep_time": 20,
                "cook_time": 45,
                "servings": 4,
                "instructions": """1. Hervir el pollo en agua con sal
2. Agregar las verduras cortadas en trozos grandes
3. Cocinar hasta que las verduras estén tiernas
4. Servir caliente con arroz
5. Condimentar al gusto""",
                "tags": "sopa,tradicional,invierno",
                "ingredients": [
                    ("Pollo", ProductCategory.CARNES, 800, "gramos"),
                    ("Zanahoria", ProductCategory.VERDURAS, 2, "unidades"),
                    ("Cebolla", ProductCategory.VERDURAS, 1, "unidades"),
                    ("Arroz", ProductCategory.ABARROTES, 100, "gramos")
                ]
            },
            {
                "name": "Completo Italiano",
                "description": "Hot dog chileno con palta, tomate y mayonesa",
                "difficulty": "facil",
                "prep_time": 10,
                "cook_time": 5,
                "servings": 2,
                "instructions": """1. Calentar las vienesas en agua hirviendo
2. Tostar el pan si se desea
3. Colocar la vienesa en el pan
4. Agregar palta molida, tomate picado y mayonesa
5. Servir inmediatamente""",
                "tags": "rapido,chileno,sandwich",
                "ingredients": [
                    ("Pan", ProductCategory.PANADERIA, 2, "unidades"),
                    ("Tomate", ProductCategory.VERDURAS, 1, "unidades")
                ]
            },
            {
                "name": "Porotos con Riendas",
                "description": "Plato tradicional de porotos con fideos y zapallo",
                "difficulty": "facil",
                "prep_time": 15,
                "cook_time": 30,
                "servings": 4,
                "instructions": """1. Remojar los porotos la noche anterior
2. Cocinar los porotos hasta que estén tiernos
3. Agregar fideos y zapallo cortado en cubos
4. Cocinar hasta que los fideos estén listos
5. Condimentar y servir caliente""",
                "tags": "tradicional,vegetariano,economico",
                "ingredients": [
                    ("Fideos", ProductCategory.ABARROTES, 200, "gramos"),
                    ("Cebolla", ProductCategory.VERDURAS, 1, "unidades"),
                    ("Aceite", ProductCategory.ABARROTES, 50, "ml")
                ]
            },
            {
                "name": "Arroz con Pollo",
                "description": "Arroz amarillo con pollo y verduras",
                "difficulty": "facil",
                "prep_time": 15,
                "cook_time": 25,
                "servings": 4,
                "instructions": """1. Sofreír el pollo cortado en trozos
2. Agregar cebolla y zanahoria picadas
3. Incorporar el arroz y mezclar
4. Agregar agua caliente y cocinar tapado
5. Cocinar hasta que el arroz esté tierno""",
                "tags": "facil,economico,nutritivo",
                "ingredients": [
                    ("Arroz", ProductCategory.ABARROTES, 300, "gramos"),
                    ("Pollo", ProductCategory.CARNES, 500, "gramos"),
                    ("Cebolla", ProductCategory.VERDURAS, 1, "unidades"),
                    ("Zanahoria", ProductCategory.VERDURAS, 1, "unidades"),
                    ("Aceite", ProductCategory.ABARROTES, 30, "ml")
                ]
            },
            {
                "name": "Charquicán",
                "description": "Guiso tradicional con papas, zapallo y carne",
                "difficulty": "facil",
                "prep_time": 20,
                "cook_time": 30,
                "servings": 4,
                "instructions": """1. Cocinar y moler las papas y zapallo
2. Sofreír la cebolla hasta dorar
3. Agregar la carne molida y cocinar
4. Incorporar las verduras molidas
5. Mezclar todo y cocinar unos minutos más""",
                "tags": "tradicional,economico,nutritivo",
                "ingredients": [
                    ("Carne molida", ProductCategory.CARNES, 300, "gramos"),
                    ("Cebolla", ProductCategory.VERDURAS, 1, "unidades"),
                    ("Aceite", ProductCategory.ABARROTES, 30, "ml")
                ]
            },
            {
                "name": "Sopaipillas",
                "description": "Masa frita tradicional chilena, perfecta para días lluviosos",
                "difficulty": "facil",
                "prep_time": 30,
                "cook_time": 15,
                "servings": 6,
                "instructions": """1. Mezclar harina, sal y aceite
2. Agregar agua tibia hasta formar masa
3. Amasar hasta que esté lisa
4. Estirar y cortar círculos
5. Freír en aceite caliente hasta dorar""",
                "tags": "tradicional,frito,lluvia",
                "ingredients": [
                    ("Harina", ProductCategory.ABARROTES, 400, "gramos"),
                    ("Aceite", ProductCategory.ABARROTES, 200, "ml")
                ]
            },
            {
                "name": "Lomo a lo Pobre",
                "description": "Lomo con huevos fritos y papas fritas",
                "difficulty": "intermedio",
                "prep_time": 15,
                "cook_time": 20,
                "servings": 2,
                "instructions": """1. Sazonar y cocinar el lomo a la plancha
2. Freír las papas cortadas en bastones
3. Freír los huevos
4. Servir el lomo con papas fritas y huevo encima
5. Acompañar con ensalada si se desea""",
                "tags": "carne,contundente,clasico",
                "ingredients": [
                    ("Carne molida", ProductCategory.CARNES, 400, "gramos"),
                    ("Huevo", ProductCategory.LACTEOS, 2, "unidades"),
                    ("Aceite", ProductCategory.ABARROTES, 100, "ml")
                ]
            },
            {
                "name": "Pan Amasado",
                "description": "Pan casero tradicional chileno",
                "difficulty": "intermedio",
                "prep_time": 120,
                "cook_time": 25,
                "servings": 8,
                "instructions": """1. Mezclar harina, sal y azúcar
2. Hacer un hoyo y agregar agua tibia
3. Amasar hasta obtener masa elástica
4. Dejar reposar 1 hora cubierto
5. Formar panes y hornear hasta dorar""",
                "tags": "panaderia,casero,tradicional",
                "ingredients": [
                    ("Harina", ProductCategory.ABARROTES, 500, "gramos"),
                    ("Leche", ProductCategory.LACTEOS, 250, "ml"),
                    ("Huevo", ProductCategory.LACTEOS, 1, "unidades"),
                    ("Azucar", ProductCategory.ABARROTES, 50, "gramos")
                ]
            }
        ]
        
        print("Creando productos y recetas...")
        
        for recipe_data in recipes_data:
            print(f"Creando receta: {recipe_data['name']}")
            
            # Crear la receta
            recipe = Recipe(
                name=recipe_data["name"],
                description=recipe_data["description"],
                difficulty=recipe_data["difficulty"],
                prep_time_minutes=recipe_data["prep_time"],
                cook_time_minutes=recipe_data["cook_time"],
                servings=recipe_data["servings"],
                instructions=recipe_data["instructions"],
                tags=recipe_data["tags"],
                image_url=image_mapping.get(recipe_data["name"])
            )
            
            db.add(recipe)
            db.flush()  # Para obtener el ID
            
            # Crear ingredientes
            for ingredient_name, category, quantity, unit in recipe_data["ingredients"]:
                product = get_or_create_product(db, ingredient_name, category, unit)
                
                ingredient = RecipeIngredient(
                    recipe_id=recipe.id,
                    product_id=product.id,
                    quantity_needed=quantity,
                    unit=unit,
                    is_optional=False
                )
                db.add(ingredient)
            
            print(f"  - Creados {len(recipe_data['ingredients'])} ingredientes")
        
        db.commit()
        print(f"\n✅ Se crearon {len(recipes_data)} recetas exitosamente!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_recipes()