#!/usr/bin/env python3
"""
Script para crear las nuevas tablas de inventario en la base de datos.
Ejecutar después de agregar los nuevos modelos.
"""

import os
import sys
from sqlalchemy import create_engine, text
from app.db import Base
from app.models import Product, UserInventory, InventoryMovement

def create_inventory_tables():
    """Crear las nuevas tablas de inventario"""
    
    # Obtener URL de la base de datos
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ ERROR: DATABASE_URL no está definido")
        print("💡 Asegúrate de tener el archivo .env configurado")
        return False
    
    try:
        # Crear engine
        engine = create_engine(database_url, pool_pre_ping=True)
        
        print("🔗 Conectando a la base de datos...")
        
        # Crear todas las tablas (solo creará las que no existen)
        Base.metadata.create_all(bind=engine)
        
        print("✅ Tablas de inventario creadas exitosamente:")
        print("   - products (catálogo de productos)")
        print("   - user_inventory (inventario por usuario)")
        print("   - inventory_movements (historial de movimientos)")
        
        # Verificar que las tablas se crearon
        with engine.connect() as conn:
            # Verificar tabla products
            result = conn.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'products'"))
            if result.scalar() > 0:
                print("✅ Tabla 'products' verificada")
            
            # Verificar tabla user_inventory
            result = conn.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_inventory'"))
            if result.scalar() > 0:
                print("✅ Tabla 'user_inventory' verificada")
            
            # Verificar tabla inventory_movements
            result = conn.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'inventory_movements'"))
            if result.scalar() > 0:
                print("✅ Tabla 'inventory_movements' verificada")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creando tablas: {e}")
        return False

def populate_initial_products():
    """Poblar catálogo inicial de productos basado en PRODUCT_TYPES"""
    from app.schemas import PRODUCT_TYPES
    from app.models import ProductCategory
    from sqlalchemy.orm import sessionmaker
    
    database_url = os.getenv("DATABASE_URL")
    engine = create_engine(database_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Mapeo de productos a categorías
    PRODUCT_CATEGORY_MAP = {
        # Abarrotes
        'Arroz': ProductCategory.ABARROTES,
        'Fideos': ProductCategory.ABARROTES,
        'Fideo': ProductCategory.ABARROTES,
        'Azucar': ProductCategory.ABARROTES,
        'Harina': ProductCategory.ABARROTES,
        'Aceite': ProductCategory.CONDIMENTOS,
        'Sal': ProductCategory.CONDIMENTOS,
        
        # Lácteos
        'Leche': ProductCategory.LACTEOS,
        'Leche evaporada': ProductCategory.LACTEOS,
        'Queso': ProductCategory.LACTEOS,
        'Yogur': ProductCategory.LACTEOS,
        'Mantequilla': ProductCategory.LACTEOS,
        
        # Carnes y proteínas
        'Atun': ProductCategory.CARNES,
        'Pollo': ProductCategory.CARNES,
        'Carne molida': ProductCategory.CARNES,
        'Hamburguesa': ProductCategory.CARNES,
        'Huevo': ProductCategory.LACTEOS,
        
        # Panadería
        'Pan': ProductCategory.PANADERIA,
        'Gallina': ProductCategory.CARNES,  # Asumo que es pollo
        
        # Frutas
        'Manzana': ProductCategory.FRUTAS,
        'Platano': ProductCategory.FRUTAS,
        'Fruta': ProductCategory.FRUTAS,
        'Berries': ProductCategory.FRUTAS,
        
        # Verduras
        'Cebolla': ProductCategory.VERDURAS,
        'Tomate': ProductCategory.VERDURAS,
        'Ajo': ProductCategory.VERDURAS,
        'Zanahoria': ProductCategory.VERDURAS,
        
        # Condimentos y salsas
        'Salsa de tomate': ProductCategory.CONDIMENTOS,
        'Sopa': ProductCategory.ABARROTES,
        
        # Pastas
        'Ravioles': ProductCategory.ABARROTES,
        
        # Congelados
        'Helado': ProductCategory.CONGELADOS,
        
        # Otros
        'Otros': ProductCategory.ABARROTES,
    }
    
    try:
        db = SessionLocal()
        
        print("📦 Poblando catálogo inicial de productos...")
        
        created_count = 0
        for product_name in PRODUCT_TYPES:
            # Verificar si el producto ya existe
            existing = db.query(Product).filter(Product.name == product_name).first()
            if existing:
                continue
            
            # Crear nuevo producto
            category = PRODUCT_CATEGORY_MAP.get(product_name, ProductCategory.ABARROTES)
            is_perishable = category in [ProductCategory.LACTEOS, ProductCategory.CARNES, 
                                       ProductCategory.VERDURAS, ProductCategory.FRUTAS, 
                                       ProductCategory.PANADERIA]
            
            product = Product(
                name=product_name,
                category=category,
                description=f"Producto {product_name}",
                default_unit="unidades",
                is_perishable=is_perishable,
                typical_shelf_life_days=7 if is_perishable else None
            )
            
            db.add(product)
            created_count += 1
        
        db.commit()
        print(f"✅ Creados {created_count} productos en el catálogo")
        
        # Mostrar resumen por categoría
        print("\n📊 Resumen por categoría:")
        for category in ProductCategory:
            count = db.query(Product).filter(Product.category == category).count()
            if count > 0:
                print(f"   - {category.value}: {count} productos")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Error poblando productos: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        return False

if __name__ == "__main__":
    print("🚀 Creando tablas de inventario...")
    
    # Agregar el directorio de la app al path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    # Crear tablas
    if create_inventory_tables():
        print("\n📦 Poblando catálogo inicial...")
        if populate_initial_products():
            print("\n🎉 ¡Setup de inventario completado exitosamente!")
            print("\n📋 Próximos pasos:")
            print("   1. Reiniciar el servidor API")
            print("   2. Verificar que las nuevas tablas están disponibles")
            print("   3. Probar los endpoints de inventario")
        else:
            print("\n⚠️  Tablas creadas pero falló la población inicial")
    else:
        print("\n❌ Falló la creación de tablas")
        sys.exit(1)