from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from typing import List, Optional
import os
import json
import time
from openai import OpenAI
from app.db import get_db
from app.models import Recipe, RecipeIngredient, Product, UserInventory, ProductCategory
from app.schemas import (
    RecipeCreate, RecipeUpdate, RecipeOut, RecipeWithAvailability, 
    RecipeListItem, RecipeIngredientWithAvailability,
    AIRecipeRequest, AIRecipeResponse, GeneratedRecipe, GeneratedRecipeIngredient,
    SaveGeneratedRecipeRequest
)

router = APIRouter(prefix="/recipes", tags=["recipes"])

def calculate_recipe_availability(recipe: Recipe, user_id: str, db: Session) -> dict:
    """
    Calcula la disponibilidad de ingredientes para una receta específica
    """
    total_ingredients = len(recipe.ingredients)
    available_count = 0
    missing_ingredients = []
    available_ingredients = []
    
    for ingredient in recipe.ingredients:
        # Buscar en el inventario del usuario
        inventory_item = db.query(UserInventory).filter(
            and_(
                UserInventory.user_id == user_id,
                UserInventory.product_id == ingredient.product_id
            )
        ).first()
        
        available_quantity = inventory_item.current_quantity if inventory_item else 0.0
        has_enough = available_quantity >= ingredient.quantity_needed
        
        if has_enough and not ingredient.is_optional:
            available_count += 1
            
        # Calcular porcentaje de disponibilidad para este ingrediente
        if ingredient.quantity_needed > 0:
            availability_percentage = min(100, (available_quantity / ingredient.quantity_needed) * 100)
        else:
            availability_percentage = 100
            
        ingredient_with_availability = RecipeIngredientWithAvailability(
            id=ingredient.id,
            recipe_id=ingredient.recipe_id,
            product_id=ingredient.product_id,
            quantity_needed=ingredient.quantity_needed,
            unit="unidades",  # SIEMPRE unidades para consistencia
            is_optional=ingredient.is_optional,
            notes=ingredient.notes,
            product=ingredient.product,
            available_quantity=available_quantity,
            has_enough=has_enough,
            availability_percentage=availability_percentage
        )
        
        if has_enough:
            available_ingredients.append(ingredient_with_availability)
        else:
            missing_ingredients.append(ingredient_with_availability)
    
    # Calcular porcentaje total (solo ingredientes no opcionales)
    non_optional_ingredients = [ing for ing in recipe.ingredients if not ing.is_optional]
    non_optional_available = len([ing for ing in available_ingredients if not ing.is_optional])
    
    if len(non_optional_ingredients) > 0:
        availability_percentage = (non_optional_available / len(non_optional_ingredients)) * 100
    else:
        availability_percentage = 100
        
    can_make = len(missing_ingredients) == 0 or all(ing.is_optional for ing in missing_ingredients)
    
    return {
        "availability_percentage": round(availability_percentage, 1),
        "missing_ingredients": missing_ingredients,
        "available_ingredients": available_ingredients,
        "can_make": can_make
    }

@router.get("/", response_model=List[RecipeListItem])
def get_recipes(
    user_id: str = Query(..., description="ID del usuario"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    difficulty: Optional[str] = Query(None, description="Filtrar por dificultad"),
    search: Optional[str] = Query(None, description="Buscar en nombre o tags"),
    db: Session = Depends(get_db)
):
    """
    Obtener lista de recetas con porcentaje de disponibilidad
    """
    query = db.query(Recipe).filter(Recipe.is_active == True)
    
    # Filtros
    if difficulty:
        query = query.filter(Recipe.difficulty == difficulty)
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Recipe.name.ilike(search_term) | 
            Recipe.tags.ilike(search_term) |
            Recipe.description.ilike(search_term)
        )
    
    recipes = query.options(joinedload(Recipe.ingredients)).offset(skip).limit(limit).all()
    
    result = []
    for recipe in recipes:
        availability_info = calculate_recipe_availability(recipe, user_id, db)
        
        recipe_item = RecipeListItem(
            id=recipe.id,
            name=recipe.name,
            description=recipe.description,
            difficulty=recipe.difficulty,
            prep_time_minutes=recipe.prep_time_minutes,
            cook_time_minutes=recipe.cook_time_minutes,
            servings=recipe.servings,
            image_url=recipe.image_url,
            tags=recipe.tags,
            availability_percentage=availability_info["availability_percentage"],
            ingredient_count=len(recipe.ingredients)
        )
        result.append(recipe_item)
    
    return result

@router.get("/{recipe_id}", response_model=RecipeWithAvailability)
def get_recipe_detail(
    recipe_id: int,
    user_id: str = Query(..., description="ID del usuario"),
    db: Session = Depends(get_db)
):
    """
    Obtener detalle completo de una receta con disponibilidad de ingredientes
    """
    recipe = db.query(Recipe).options(
        joinedload(Recipe.ingredients).joinedload(RecipeIngredient.product)
    ).filter(
        and_(Recipe.id == recipe_id, Recipe.is_active == True)
    ).first()
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    
    availability_info = calculate_recipe_availability(recipe, user_id, db)
    
    return RecipeWithAvailability(
        id=recipe.id,
        name=recipe.name,
        description=recipe.description,
        difficulty=recipe.difficulty,
        prep_time_minutes=recipe.prep_time_minutes,
        cook_time_minutes=recipe.cook_time_minutes,
        servings=recipe.servings,
        instructions=recipe.instructions,
        image_url=recipe.image_url,
        tags=recipe.tags,
        created_at=recipe.created_at,
        updated_at=recipe.updated_at,
        is_active=recipe.is_active,
        ingredients=[],  # Se llena con availability_info
        availability_percentage=availability_info["availability_percentage"],
        missing_ingredients=availability_info["missing_ingredients"],
        available_ingredients=availability_info["available_ingredients"],
        can_make=availability_info["can_make"]
    )

@router.post("/", response_model=RecipeOut)
def create_recipe(recipe: RecipeCreate, db: Session = Depends(get_db)):
    """
    Crear una nueva receta
    """
    # Verificar que todos los productos existen
    product_ids = [ing.product_id for ing in recipe.ingredients]
    existing_products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    existing_product_ids = {p.id for p in existing_products}
    
    missing_products = set(product_ids) - existing_product_ids
    if missing_products:
        raise HTTPException(
            status_code=400, 
            detail=f"Productos no encontrados: {list(missing_products)}"
        )
    
    # Crear receta
    db_recipe = Recipe(
        name=recipe.name,
        description=recipe.description,
        difficulty=recipe.difficulty,
        prep_time_minutes=recipe.prep_time_minutes,
        cook_time_minutes=recipe.cook_time_minutes,
        servings=recipe.servings,
        instructions=recipe.instructions,
        image_url=recipe.image_url,
        tags=recipe.tags
    )
    
    db.add(db_recipe)
    db.flush()  # Para obtener el ID
    
    # Crear ingredientes
    for ingredient_data in recipe.ingredients:
        db_ingredient = RecipeIngredient(
            recipe_id=db_recipe.id,
            product_id=ingredient_data.product_id,
            quantity_needed=ingredient_data.quantity_needed,
            unit=ingredient_data.unit,
            is_optional=ingredient_data.is_optional,
            notes=ingredient_data.notes
        )
        db.add(db_ingredient)
    
    db.commit()
    db.refresh(db_recipe)
    
    return db_recipe

@router.put("/{recipe_id}", response_model=RecipeOut)
def update_recipe(
    recipe_id: int, 
    recipe_update: RecipeUpdate, 
    db: Session = Depends(get_db)
):
    """
    Actualizar una receta existente
    """
    db_recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    
    # Actualizar campos de la receta
    update_data = recipe_update.dict(exclude_unset=True, exclude={"ingredients"})
    for field, value in update_data.items():
        setattr(db_recipe, field, value)
    
    # Actualizar ingredientes si se proporcionan
    if recipe_update.ingredients is not None:
        # Eliminar ingredientes existentes
        db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe_id).delete()
        
        # Verificar que todos los productos existen
        product_ids = [ing.product_id for ing in recipe_update.ingredients]
        existing_products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        existing_product_ids = {p.id for p in existing_products}
        
        missing_products = set(product_ids) - existing_product_ids
        if missing_products:
            raise HTTPException(
                status_code=400, 
                detail=f"Productos no encontrados: {list(missing_products)}"
            )
        
        # Crear nuevos ingredientes
        for ingredient_data in recipe_update.ingredients:
            db_ingredient = RecipeIngredient(
                recipe_id=recipe_id,
                product_id=ingredient_data.product_id,
                quantity_needed=ingredient_data.quantity_needed,
                unit=ingredient_data.unit,
                is_optional=ingredient_data.is_optional,
                notes=ingredient_data.notes
            )
            db.add(db_ingredient)
    
    db.commit()
    db.refresh(db_recipe)
    
    return db_recipe

@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    """
    Eliminar una receta (soft delete)
    """
    db_recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    
    db_recipe.is_active = False
    db.commit()
    
    return {"message": "Receta eliminada correctamente"}


# ===============================
# AI RECIPE GENERATION ENDPOINTS
# ===============================

def get_user_inventory_summary(user_id: str, db: Session) -> dict:
    """
    Obtiene un resumen del inventario del usuario para el prompt de IA
    """
    inventory_items = db.query(UserInventory).options(
        joinedload(UserInventory.product)
    ).filter(UserInventory.user_id == user_id).all()
    
    inventory_summary = {}
    total_items = 0
    
    for item in inventory_items:
        if item.current_quantity > 0:
            inventory_summary[item.product.name] = item.current_quantity
            total_items += 1
    
    return {
        "items": inventory_summary,
        "total_items": total_items
    }

def create_ai_recipe_prompt(request: AIRecipeRequest, inventory: dict) -> str:
    """
    Crea el prompt optimizado para OpenAI basado en las preferencias del usuario
    """
    # Construir lista de ingredientes disponibles
    available_ingredients = ""
    inventory_context = ""
    
    if inventory["items"] and request.maximize_pantry_use:
        ingredients_list = [f"- {name}: {qty} unidades" for name, qty in inventory["items"].items()]
        available_ingredients = f"""
🏠 INGREDIENTES DISPONIBLES EN TU DESPENSA:
{chr(10).join(ingredients_list)}

⭐ PRIORIDAD ALTA: Usa estos ingredientes disponibles como base principal de las recetas.
"""
        inventory_context = f"El usuario tiene {len(inventory['items'])} ingredientes disponibles. "
    
    # Construir preferencias con más contexto
    cuisine_types_str = ", ".join([ct.value for ct in request.cuisine_types])
    equipment_str = ", ".join([eq.value for eq in request.available_equipment])
    
    # Contexto de presupuesto
    budget_context = {
        "bajo": "Usa ingredientes económicos y básicos. Evita productos premium.",
        "medio": "Balancea calidad y precio. Usa ingredientes accesibles.",
        "libre": "Puedes incluir ingredientes premium y de mejor calidad."
    }
    
    # Contexto de dificultad
    difficulty_context = {
        "facil": "Técnicas simples, pocos pasos, ingredientes básicos. Perfecto para principiantes.",
        "intermedio": "Técnicas moderadas, algunos pasos especiales. Para cocineros con experiencia básica.",
        "dificil": "Técnicas avanzadas, múltiples pasos, presentación elaborada. Para cocineros experimentados."
    }
    
    prompt = f"""Eres un chef profesional especializado en crear recetas personalizadas para usuarios chilenos. {inventory_context}Genera EXACTAMENTE 3 recetas diferentes y deliciosas que cumplan estos requisitos:

📋 REQUISITOS ESPECÍFICOS:
- ⏱️ Tiempo máximo: {request.max_time_minutes} minutos (preparación + cocción combinados)
- 👥 Porciones: {request.servings} personas
- 🎯 Dificultad: {request.difficulty.value} ({difficulty_context[request.difficulty.value]})
- 🍽️ Tipos de cocina: {cuisine_types_str}
- 🔧 Equipos disponibles: {equipment_str}
- 💰 Presupuesto: {request.budget.value} ({budget_context[request.budget.value]})
{available_ingredients}
FORMATO DE RESPUESTA (JSON):
{{
  "recipes": [
    {{
      "name": "Nombre de la receta",
      "description": "Descripción breve y atractiva",
      "difficulty": "{request.difficulty.value}",
      "prep_time_minutes": 15,
      "cook_time_minutes": 10,
      "servings": {request.servings},
      "instructions": "Instrucciones paso a paso detalladas con cantidades específicas en gramos/ml",
      "tags": "tag1,tag2,tag3",
      "ingredients": [
        {{
          "name": "Nombre del ingrediente",
          "quantity": 2,
          "unit": "unidades",
          "is_optional": false,
          "notes": "Notas adicionales (opcional)"
        }}
      ]
    }}
  ]
}}

🎯 INSTRUCCIONES CRÍTICAS OPTIMIZADAS:

1. ✅ CANTIDAD: Genera EXACTAMENTE 3 recetas diferentes y deliciosas
2. 🌟 VARIEDAD: Cada receta debe ser única en sabor, técnica y presentación
3. 🇨🇱 CONTEXTO CHILENO: Usa ingredientes comunes en supermercados chilenos
4. 📊 SISTEMA DE UNIDADES OBLIGATORIO:
   
   🥘 ABARROTES:
   - Arroz/Fideos/Pasta: 1 paquete = 1 unidad
   - Harina/Azúcar: 1 bolsa = 1 unidad
   - Aceite/Vinagre: 1 botella = 1 unidad
   
   🥚 PROTEÍNAS:
   - Huevos: cantidad individual (3 huevos = 3 unidades)
   - Carne molida/Pollo: 1 bandeja/presa = 1 unidad
   - Pescado: 1 filete = 1 unidad
   
   🥬 VERDURAS Y FRUTAS:
   - Tomates/Pimentones/Cebollas: cantidad individual
   - Espinacas/Lechuga: 1 atado = 1 unidad
   - Ajo: 1 cabeza = 1 unidad
   - Limones: cantidad individual
   
   🧀 LÁCTEOS:
   - Queso: 1 envase/trozo = 1 unidad
   - Leche/Yogur: 1 envase = 1 unidad
   - Mantequilla: 1 barra = 1 unidad

5. ⚠️ OBLIGATORIO: SIEMPRE usa "unidades" como unit, NUNCA gramos, ml, kg, etc.
6. 📝 INSTRUCCIONES DETALLADAS: Incluye medidas específicas en gramos/ml para precisión
7. 🏠 PRIORIDAD INVENTARIO: Si hay ingredientes disponibles, úsalos como base principal
8. 📖 CLARIDAD: Instrucciones paso a paso, numeradas, fáciles de seguir
9. 🏷️ TAGS RELEVANTES: Máximo 4 tags descriptivos (ej: "rápido,vegetariano,económico,saludable")
10. 🎨 PRESENTACIÓN: Incluye tips de presentación en las instrucciones
11. 💡 CONSEJOS: Agrega 1-2 consejos útiles en las instrucciones
12. 📄 FORMATO: Responde SOLO con el JSON válido, sin texto adicional
13. Importante: el campo 'instructions' debe ser SIEMPRE un string con saltos de línea '\\n', nunca un array o lista.


EJEMPLOS DE CANTIDADES CORRECTAS:
- "Fideos": quantity: 1 (1 paquete de 500g)
- "Huevos": quantity: 3 (3 huevos individuales)
- "Pimentón": quantity: 2 (2 pimentones enteros)
- "Cebolla": quantity: 1 (1 cebolla entera)
- "Queso": quantity: 1 (1 trozo/envase de queso)
"""
    
    return prompt

def get_or_create_product_by_name(db: Session, ingredient_name: str) -> Product:
    """
    Busca un producto por nombre o lo crea automáticamente en el catálogo.
    NO agrega el producto al inventario del usuario.
    """
    # Normalizar nombre del ingrediente
    normalized_name = ingredient_name.strip().title()
    
    # Buscar producto existente (case-insensitive)
    product = db.query(Product).filter(
        func.lower(Product.name) == func.lower(normalized_name)
    ).first()
    
    if product:
        print(f"Producto existente encontrado: {product.name} (ID: {product.id})")
        return product
    
    # Crear producto automáticamente en el catálogo
    # Mapeo extendido de categorías basado en palabras clave
    category_mapping = {
        # Abarrotes
        "arroz": ProductCategory.ABARROTES,
        "fideos": ProductCategory.ABARROTES,
        "pasta": ProductCategory.ABARROTES,
        "harina": ProductCategory.ABARROTES,
        "aceite": ProductCategory.ABARROTES,
        "azucar": ProductCategory.ABARROTES,
        "sal": ProductCategory.CONDIMENTOS,
        "vinagre": ProductCategory.CONDIMENTOS,
        "avena": ProductCategory.ABARROTES,
        "quinoa": ProductCategory.ABARROTES,
        "lentejas": ProductCategory.ABARROTES,
        "porotos": ProductCategory.ABARROTES,
        "garbanzos": ProductCategory.ABARROTES,
        
        # Lácteos
        "leche": ProductCategory.LACTEOS,
        "queso": ProductCategory.LACTEOS,
        "yogur": ProductCategory.LACTEOS,
        "mantequilla": ProductCategory.LACTEOS,
        "crema": ProductCategory.LACTEOS,
        "huevo": ProductCategory.LACTEOS,
        
        # Carnes
        "pollo": ProductCategory.CARNES,
        "carne": ProductCategory.CARNES,
        "pescado": ProductCategory.CARNES,
        "salmón": ProductCategory.CARNES,
        "atún": ProductCategory.CARNES,
        "cerdo": ProductCategory.CARNES,
        "pavo": ProductCategory.CARNES,
        
        # Embutidos
        "jamón": ProductCategory.EMBUTIDOS,
        "salame": ProductCategory.EMBUTIDOS,
        "chorizo": ProductCategory.EMBUTIDOS,
        "mortadela": ProductCategory.EMBUTIDOS,
        
        # Panadería
        "pan": ProductCategory.PANADERIA,
        "marraqueta": ProductCategory.PANADERIA,
        "hallulla": ProductCategory.PANADERIA,
        "tortilla": ProductCategory.PANADERIA,
        
        # Verduras
        "cebolla": ProductCategory.VERDURAS,
        "tomate": ProductCategory.VERDURAS,
        "ajo": ProductCategory.VERDURAS,
        "zanahoria": ProductCategory.VERDURAS,
        "pimentón": ProductCategory.VERDURAS,
        "pimiento": ProductCategory.VERDURAS,
        "espinaca": ProductCategory.VERDURAS,
        "lechuga": ProductCategory.VERDURAS,
        "apio": ProductCategory.VERDURAS,
        "brócoli": ProductCategory.VERDURAS,
        "coliflor": ProductCategory.VERDURAS,
        "pepino": ProductCategory.VERDURAS,
        "perejil": ProductCategory.VERDURAS,
        "cilantro": ProductCategory.VERDURAS,
        
        # Frutas
        "manzana": ProductCategory.FRUTAS,
        "plátano": ProductCategory.FRUTAS,
        "naranja": ProductCategory.FRUTAS,
        "limón": ProductCategory.FRUTAS,
        "palta": ProductCategory.FRUTAS,
        "uva": ProductCategory.FRUTAS,
        "frutilla": ProductCategory.FRUTAS,
        
        # Condimentos
        "pimienta": ProductCategory.CONDIMENTOS,
        "comino": ProductCategory.CONDIMENTOS,
        "orégano": ProductCategory.CONDIMENTOS,
        "ají": ProductCategory.CONDIMENTOS,
        "paprika": ProductCategory.CONDIMENTOS,
        "laurel": ProductCategory.CONDIMENTOS,
        "tomillo": ProductCategory.CONDIMENTOS,
    }
    
    # Determinar categoría por palabras clave (busca en todo el nombre)
    ingredient_lower = normalized_name.lower()
    category = ProductCategory.ABARROTES  # Default
    
    for keyword, cat in category_mapping.items():
        if keyword in ingredient_lower:
            category = cat
            break
    
    # Determinar si es perecedero basado en la categoría
    perishable_categories = {
        ProductCategory.LACTEOS,
        ProductCategory.CARNES,
        ProductCategory.EMBUTIDOS,
        ProductCategory.PANADERIA,
        ProductCategory.VERDURAS,
        ProductCategory.FRUTAS,
    }
    is_perishable = category in perishable_categories
    
    # Crear nuevo producto en el catálogo (NO en inventario del usuario)
    new_product = Product(
        name=normalized_name,
        category=category,
        default_unit="unidades",
        is_perishable=is_perishable,
        description=f"Producto creado automáticamente desde receta generada por IA"
    )
    
    db.add(new_product)
    db.flush()  # Para obtener el ID
    
    print(f"Nuevo producto creado: {new_product.name} (ID: {new_product.id}, Categoría: {category.value})")
    
    return new_product

def calculate_generated_recipe_availability(recipe: GeneratedRecipe, user_id: str, db: Session) -> dict:
    """
    Calcula la disponibilidad de una receta generada por IA
    """
    missing_ingredients = []
    total_ingredients = len([ing for ing in recipe.ingredients if not ing.is_optional])
    available_count = 0
    
    for ingredient in recipe.ingredients:
        if ingredient.is_optional:
            continue
            
        # Buscar producto en el catálogo
        product = db.query(Product).filter(
            func.lower(Product.name) == func.lower(ingredient.name)
        ).first()
        
        if not product:
            missing_ingredients.append(ingredient.name)
            continue
            
        # Buscar en inventario del usuario
        inventory_item = db.query(UserInventory).filter(
            and_(
                UserInventory.user_id == user_id,
                UserInventory.product_id == product.id
            )
        ).first()
        
        available_quantity = inventory_item.current_quantity if inventory_item else 0
        
        if available_quantity >= ingredient.quantity:
            available_count += 1
        else:
            missing_ingredients.append(ingredient.name)
    
    availability_percentage = (available_count / total_ingredients * 100) if total_ingredients > 0 else 100
    can_make = len(missing_ingredients) == 0
    
    return {
        "availability_percentage": round(availability_percentage, 1),
        "missing_ingredients": missing_ingredients,
        "can_make": can_make
    }

@router.post("/generate-with-ai", response_model=AIRecipeResponse)
async def generate_recipes_with_ai(
    request: AIRecipeRequest,
    db: Session = Depends(get_db)
):
    """
    Generar 3 recetas personalizadas usando IA basadas en preferencias del usuario
    """
    start_time = time.time()
    
    # Verificar configuración de OpenAI
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY no configurado")
    
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    client = OpenAI(api_key=api_key)
    
    try:
        # Obtener inventario del usuario
        inventory = get_user_inventory_summary(request.user_id, db)
        
        # Crear prompt personalizado
        prompt = create_ai_recipe_prompt(request, inventory)
        
        # Llamar a OpenAI
        response = client.chat.completions.create(
            model=model,
            temperature=0.7,  # Un poco de creatividad
            messages=[
                {"role": "system", "content": "Eres un chef experto que crea recetas personalizadas en formato JSON."},
                {"role": "user", "content": prompt}
            ],
            timeout=120  # 120 segundos timeout
        )
        
        # Parsear respuesta
        raw_content = response.choices[0].message.content
        print(f"DEBUG: OpenAI raw response: {raw_content}")  # Debug log
        
        if not raw_content or raw_content.strip() == "":
            raise HTTPException(status_code=500, detail="OpenAI devolvió respuesta vacía")
        
        # Limpiar markdown si está presente
        cleaned_content = raw_content.strip()
        if cleaned_content.startswith("```json"):
            cleaned_content = cleaned_content[7:]  # Remover ```json
        elif cleaned_content.startswith("```"):
            cleaned_content = cleaned_content[3:]   # Remover ```
        
        if cleaned_content.endswith("```"):
            cleaned_content = cleaned_content[:-3]  # Remover ``` del final
        
        cleaned_content = cleaned_content.strip()
        print(f"DEBUG: Cleaned content: {cleaned_content}")  # Debug log
        
        recipes_data = json.loads(cleaned_content)
        
        # Validar que tenemos exactamente 3 recetas
        if "recipes" not in recipes_data or len(recipes_data["recipes"]) != 3:
            raise HTTPException(status_code=500, detail="IA no generó exactamente 3 recetas")
        
        # Convertir a objetos GeneratedRecipe y calcular disponibilidad
        generated_recipes = []
        for recipe_data in recipes_data["recipes"]:
            # Forzar que todos los ingredientes usen "unidades"
            for ingredient in recipe_data.get("ingredients", []):
                ingredient["unit"] = "unidades"  # Forzar unidades

            # 🩹 FIX: normalizar instrucciones
            instructions = recipe_data.get("instructions")
            if isinstance(instructions, list):
                # Une cada paso en una sola cadena, una línea por paso
                recipe_data["instructions"] = "\n".join(
                    str(step).strip() for step in instructions
                )
            elif not isinstance(instructions, str):
                # Por si acaso viene en otro formato raro
                recipe_data["instructions"] = str(instructions)
                    
            # Crear objeto GeneratedRecipe
            recipe = GeneratedRecipe(**recipe_data)
            
            # Calcular disponibilidad
            availability_info = calculate_generated_recipe_availability(recipe, request.user_id, db)
            recipe.availability_percentage = availability_info["availability_percentage"]
            recipe.missing_ingredients = availability_info["missing_ingredients"]
            recipe.can_make = availability_info["can_make"]
            
            generated_recipes.append(recipe)
        
        generation_time = time.time() - start_time
        
        return AIRecipeResponse(
            recipes=generated_recipes,
            generation_time_seconds=round(generation_time, 2),
            user_inventory_items=inventory["total_items"],
            prompt_used=prompt if os.getenv("DEBUG") == "true" else None
        )
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Error parseando respuesta de IA: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error llamando a OpenAI: {e}")

@router.post("/save-generated", response_model=RecipeOut)
def save_generated_recipe(
    request: SaveGeneratedRecipeRequest,
    db: Session = Depends(get_db)
):
    """
    Guardar una receta generada por IA como receta permanente.
    
    - Convierte receta generada a receta permanente
    - Crea automáticamente productos faltantes en catálogo
    - NO agrega productos al inventario del usuario
    - Agrega tag "generada_por_ia"
    """
    try:
        print(f"Guardando receta generada por IA: {request.recipe.name}")
        
        # Validar datos de entrada
        if not request.recipe.name or not request.recipe.name.strip():
            raise HTTPException(status_code=400, detail="Nombre de receta requerido")
        
        if not request.recipe.ingredients or len(request.recipe.ingredients) == 0:
            raise HTTPException(status_code=400, detail="La receta debe tener al menos un ingrediente")
        
        # Preparar tags (asegurar que incluya el tag de IA)
        existing_tags = request.recipe.tags or ""
        if "generada_por_ia" not in existing_tags.lower():
            ai_tags = f"{existing_tags},generada_por_ia" if existing_tags else "generada_por_ia"
        else:
            ai_tags = existing_tags
        
        # Crear la receta principal
        db_recipe = Recipe(
            name=request.recipe.name.strip(),
            description=request.recipe.description or "Receta generada por inteligencia artificial",
            difficulty=request.recipe.difficulty,
            prep_time_minutes=request.recipe.prep_time_minutes,
            cook_time_minutes=request.recipe.cook_time_minutes,
            servings=request.recipe.servings,
            instructions=request.recipe.instructions,
            image_url=None,  # Las recetas IA no tienen imagen por defecto
            tags=ai_tags
        )
        
        db.add(db_recipe)
        db.flush()  # Para obtener el ID
        
        print(f"Receta creada con ID: {db_recipe.id}")
        
        # Crear ingredientes y productos automáticamente
        created_products = []
        for ingredient_data in request.recipe.ingredients:
            print(f"Procesando ingrediente: {ingredient_data.name}")
            
            # Buscar o crear producto en catálogo (NO en inventario)
            product = get_or_create_product_by_name(db, ingredient_data.name)
            
            # Validar cantidad
            if ingredient_data.quantity <= 0:
                print(f"Advertencia: Cantidad inválida para {ingredient_data.name}: {ingredient_data.quantity}")
                ingredient_data.quantity = 1  # Default a 1
            
            # Crear ingrediente de receta
            db_ingredient = RecipeIngredient(
                recipe_id=db_recipe.id,
                product_id=product.id,
                quantity_needed=ingredient_data.quantity,
                unit="unidades",  # Siempre unidades para consistencia
                is_optional=ingredient_data.is_optional or False,
                notes=ingredient_data.notes
            )
            db.add(db_ingredient)
            
            # Trackear productos creados para logging
            if product.id not in [p.id for p in created_products]:
                created_products.append(product)
        
        db.commit()
        db.refresh(db_recipe)
        
        # Logging de éxito
        print(f"✅ Receta guardada exitosamente:")
        print(f"   - ID: {db_recipe.id}")
        print(f"   - Nombre: {db_recipe.name}")
        print(f"   - Ingredientes: {len(request.recipe.ingredients)}")
        print(f"   - Productos nuevos creados: {len([p for p in created_products if 'automáticamente' in (p.description or '')])}")
        print(f"   - Tags: {db_recipe.tags}")
        
        return db_recipe
        
    except HTTPException:
        # Re-raise HTTP exceptions
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error guardando receta: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno guardando receta: {str(e)}")

@router.get("/ai/stats")
def get_ai_generated_stats(db: Session = Depends(get_db)):
    """
    Obtener estadísticas de recetas generadas por IA y productos creados automáticamente
    """
    try:
        # Contar recetas generadas por IA
        ai_recipes_count = db.query(Recipe).filter(
            Recipe.tags.ilike("%generada_por_ia%"),
            Recipe.is_active == True
        ).count()
        
        # Contar productos creados automáticamente
        auto_products_count = db.query(Product).filter(
            Product.description.ilike("%automáticamente%")
        ).count()
        
        # Obtener recetas IA más recientes
        recent_ai_recipes = db.query(Recipe).filter(
            Recipe.tags.ilike("%generada_por_ia%"),
            Recipe.is_active == True
        ).order_by(Recipe.created_at.desc()).limit(5).all()
        
        # Obtener productos más creados automáticamente
        auto_products = db.query(Product).filter(
            Product.description.ilike("%automáticamente%")
        ).order_by(Product.created_at.desc()).limit(10).all()
        
        return {
            "ai_recipes_count": ai_recipes_count,
            "auto_products_count": auto_products_count,
            "recent_ai_recipes": [
                {
                    "id": recipe.id,
                    "name": recipe.name,
                    "difficulty": recipe.difficulty,
                    "created_at": recipe.created_at
                }
                for recipe in recent_ai_recipes
            ],
            "auto_products": [
                {
                    "id": product.id,
                    "name": product.name,
                    "category": product.category.value,
                    "created_at": product.created_at
                }
                for product in auto_products
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")
