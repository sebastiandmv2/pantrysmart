#!/bin/bash

echo "🍽️ Configurando recetas chilenas en PantrySmart..."

# Navegar al directorio de la API
cd api

# Crear las tablas de recetas primero
echo "🔧 Creando tablas de recetas..."
python3 create_recipe_tables.py

if [ $? -ne 0 ]; then
    echo "❌ Error al crear tablas de recetas"
    exit 1
fi

# Ejecutar el script de población de recetas
echo "📝 Poblando base de datos con recetas chilenas..."
python3 populate_recipes.py

if [ $? -eq 0 ]; then
    echo "✅ Recetas creadas exitosamente!"
    echo ""
    echo "Las siguientes recetas están ahora disponibles:"
    echo "1. Empanadas de Pino"
    echo "2. Pastel de Choclo"
    echo "3. Cazuela de Pollo"
    echo "4. Completo Italiano"
    echo "5. Porotos con Riendas"
    echo "6. Arroz con Pollo"
    echo "7. Charquicán"
    echo "8. Sopaipillas"
    echo "9. Lomo a lo Pobre"
    echo "10. Pan Amasado"
    echo ""
    echo "🚀 Puedes ahora usar la aplicación para ver las recetas con disponibilidad de ingredientes!"
else
    echo "❌ Error al crear las recetas. Revisa los logs arriba."
    exit 1
fi