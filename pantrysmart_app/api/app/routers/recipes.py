from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from typing import List, Optional
from app.db import get_db
from app.models import Recipe, RecipeIngredient, Product, UserInventory
from app.schemas import (
    RecipeCreate, RecipeUpdate, RecipeOut, RecipeWithAvailability, 
    RecipeListItem, RecipeIngredientWithAvailability
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
            unit=ingredient.unit,
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