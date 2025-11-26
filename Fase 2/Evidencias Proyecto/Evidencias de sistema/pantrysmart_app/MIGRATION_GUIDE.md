# Guía de Migración - Nuevo Schema de Inventario

## Resumen de Cambios

Se ha actualizado la aplicación para usar un nuevo schema de inventario que:

1. **Extrae solo productos de inventario** (is_inventario: true)
2. **Elimina precios y totales** - solo se guarda nombre, tipo y cantidad
3. **Usa tipos de productos canónicos** en lugar de categorías
4. **Simplifica la estructura de la base de datos**

## Cambios en la Base de Datos

### Tabla `receipts`
- ✅ Mantiene: `id`, `user_id`, `created_at`
- ✅ Cambia: `store` (antes era requerido, ahora opcional - viene de `sucursal_o_direccion`)
- ❌ Elimina: `date`, `time`, `subtotal`, `updated_at`

### Tabla `receipt_items`
- ✅ Mantiene: `id`, `receipt_id`, `quantity`, `is_active`, `deleted_at`
- ✅ Cambia: `product_name` (ahora es el `NombreOriginal` del OCR)
- ✅ Agrega: `product_type` (tipo canónico del producto)
- ❌ Elimina: `category`, `unit_price`, `total_price`

## Pasos para Aplicar la Migración

### 1. Backend (API)

```bash
cd pantrysmart_app/api

# Ejecutar migración de base de datos
python migrate_db.py

# Reiniciar el servidor
# (si usas Docker, rebuild el contenedor)
```

### 2. Frontend (Mobile)

Los cambios en el frontend son compatibles y no requieren migración adicional.

## Nuevos Tipos de Productos

El sistema ahora usa estos tipos canónicos:

```
Abarrotes: Arroz, Fideos, Azucar, Harina, Sal
Lácteos: Leche, Queso, Yogur, Mantequilla  
Carnes: Pollo, Carne molida, Atun
Panadería: Pan, Huevo
Frutas: Manzana, Platano
Verduras: Cebolla, Tomate, Ajo, Zanahoria
Congelados: Helado
Condimentos: Aceite, Salsa de tomate
Otros: Para productos no clasificados
```

## Flujo de Usuario Actualizado

1. **Escaneo**: Usuario toma foto de boleta
2. **Extracción**: IA extrae productos y filtra solo los de inventario
3. **Confirmación**: Usuario revisa y edita productos antes de guardar
   - Puede cambiar el tipo de producto (dropdown)
   - Puede ajustar cantidades
   - Puede eliminar productos
4. **Guardado**: Solo se guardan productos de inventario

## Pantallas Actualizadas

- ✅ `ScanScreen`: Navega a nueva pantalla de confirmación
- ✅ `ReceiptConfirmScreen`: Nueva pantalla para editar antes de guardar
- ✅ `ReceiptDetailScreen`: Muestra tipos de productos en lugar de categorías
- ✅ `ReceiptsScreen`: Actualizado para nueva estructura de datos

## Verificación

Después de la migración, verifica que:

1. ✅ La base de datos se migró correctamente
2. ✅ El API responde con la nueva estructura
3. ✅ El escaneo de boletas funciona
4. ✅ La pantalla de confirmación permite editar productos
5. ✅ Los detalles de boleta muestran la información correcta

## Rollback (si es necesario)

Si necesitas revertir los cambios:

1. Las tablas `*_backup` contienen los datos originales
2. Restaura desde backup y revierte los cambios de código
3. O usa un backup de base de datos anterior

## Notas Importantes

- ⚠️ **Datos existentes**: Los receipts antiguos no son compatibles con el nuevo schema
- ⚠️ **OpenAI API**: Asegúrate de que `OPENAI_API_KEY` esté configurado
- ⚠️ **Testing**: Prueba el flujo completo antes de usar en producción