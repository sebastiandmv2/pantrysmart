from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Receipt, ReceiptItem
from app.schemas import ReceiptConfirmIn, ReceiptOut
from openai import OpenAI
import os, base64, json
from typing import List

router = APIRouter()

DEMO_USER_ID = os.getenv("DEMO_USER_ID", "demo-user")

SYSTEM_PROMPT = """Eres un extractor de datos de boletas chilenas. Analiza la imagen y devuelve ÚNICAMENTE JSON válido.
No inventes datos: si falta algo, usa null (para tienda) o valores por defecto según el esquema.
Ignora precios, totales y descuentos. Solo queremos nombre/cantidad y su clasificación (Producto, Categoria).
No incluyas explicaciones fuera del JSON.
"""

USER_PROMPT = """Tarea: extrae la información de la boleta y devuélvela en este esquema JSON:
{
  "tienda": {
    "nombre": null,
    "sucursal_o_direccion": null
  },
  "items": [
    {
      "NombreOriginal": "string",
      "Cantidad": 1,
      "Producto": "string",
      "Categoria": "string",
      "is_inventario": true
    }
  ]
}

Definiciones:
- "NombreOriginal": la línea de producto tal como aparece (limpia ruido obvio de OCR/vision si existiera, pero conserva la marca).
- "Cantidad": si hay patron de multiplicidad (2X..., x6, "6 UN", "PACK 6", "3 x 1.290", etc.), usa esa cantidad. Si no, 1.
- "Producto": nombre canónico generico en singular. DEBE ser uno de estos tipos EXACTOS:
  ["Arroz", "Fideos", "Fideo", "Azucar", "Harina", "Aceite", "Sal", "Leche", "Leche evaporada", "Queso", "Yogur", "Mantequilla",
   "Atun", "Pollo", "Carne molida", "Hamburguesa", "Huevo", "Pan", "Gallina", "Manzana", "Platano", "Fruta", "Berries",
   "Cebolla", "Tomate", "Ajo", "Zanahoria", "Salsa de tomate", "Sopa", "Ravioles", "Helado", "Otros"].
  Si no encuentras una coincidencia exacta, usa "Otros". No inventes nuevos tipos.
- "Categoria": una de las siguientes (elige la mas adecuada):
  ["Abarrotes","Lacteos","Carnes","Embutidos","Panaderia","Verduras","Frutas","Congelados",
   "Dulces","Snacks","Condimentos","Bebestibles","Limpieza","CuidadoPersonal","Mascotas","Hogar"]
- "is_inventario": true si la categoria es de alimentos/preparacion de recetas del dia a dia
  (Abarrotes,Lacteos,Carnes,Embutidos,Panaderia,Verduras,Frutas,Congelados,Condimentos).
  false si es Limpieza,CuidadoPersonal,Mascotas,Hogar o Bebestibles (segun criterio de exclusión del inventario de recetas).

Reglas:
1) Recorre la boleta de arriba hacia abajo; cada item corresponde a una linea de producto (ignora totales, subtotales, formas de pago).
2) "NombreOriginal": conserva marca y descripcion; no mezcles con lineas de descuento/promos.
3) "Cantidad": detecta patrones como 2X, 3 x 1.290, x6, "6 UN/UNI", "PACK 6", etc.; si no hay multiplicidad, usa 1.
4) "Producto": canónico generico en singular (sin marca, sin peso/volumen/sabor). DEBE ser uno de los tipos válidos de la lista. Si no hay coincidencia exacta, usa "Otros".
5) "Categoria": elige la mas pertinente de la lista.
6) "is_inventario": asigna segun la regla explicada arriba.
7) Salida: ÚNICAMENTE el JSON con el esquema.
8) IMPORTANTE: Solo usa tipos de "Producto" de la lista proporcionada. No inventes nuevos tipos.

Importante:
- Ignora precios, totales y descuentos.
- No incluyas markdown ni comentarios, solo el JSON.
"""

RECEIPT_SCHEMA = {
    "name": "boleta_schema_v2",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "tienda": {
                "type": "object",
                "properties": {
                    "nombre": {"type": ["string", "null"]},
                    "sucursal_o_direccion": {"type": ["string", "null"]}
                },
                "required": ["nombre", "sucursal_o_direccion"],
                "additionalProperties": False
            },
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "NombreOriginal": {"type": "string"},
                        "Cantidad": {"type": "integer", "minimum": 1},
                        "Producto": {"type": "string"},
                        "Categoria": {
                            "type": "string",
                            "enum": [
                                "Abarrotes","Lacteos","Carnes","Embutidos","Panaderia","Verduras","Frutas",
                                "Congelados","Dulces","Snacks","Condimentos","Bebestibles","Limpieza",
                                "CuidadoPersonal","Mascotas","Hogar"
                            ]
                        },
                        "is_inventario": {"type": "boolean"}
                    },
                    "required": ["NombreOriginal","Cantidad","Producto","Categoria","is_inventario"],
                    "additionalProperties": False
                }
            }
        },
        "required": ["tienda", "items"],
        "additionalProperties": False
    }
}

def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("utf-8")

@router.post("/receipts/debug-upload", tags=["receipts"])
async def debug_upload(file: UploadFile = File(...)):
    """Endpoint de debug para verificar que la imagen se recibe correctamente"""
    print(f"Received file: {file.filename}")
    print(f"Content type: {file.content_type}")
    print(f"File size: {file.size if hasattr(file, 'size') else 'unknown'}")
    
    if not file.content_type or not file.content_type.startswith("image/"):
        return {"error": "Se requiere una imagen", "received_type": file.content_type}
    
    # Leer algunos bytes para verificar
    content = await file.read()
    print(f"Content length: {len(content)} bytes")
    
    return {
        "success": True,
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(content),
        "first_bytes": content[:10].hex() if content else "empty"
    }

@router.post("/receipts/extract-receipt", tags=["receipts"])
async def extract_receipt(file: UploadFile = File(...)):
    from app.schemas import PRODUCT_TYPES
    from app.product_mapping import normalize_product_name
    import logging
    
    logger = logging.getLogger(__name__)
    
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Se requiere una imagen (content-type image/*).")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY no configurado en el entorno.")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    client = OpenAI(api_key=api_key)

    image_bytes = await file.read()
    image_b64 = _b64(image_bytes)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": USER_PROMPT},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
            ]
        }
    ]

    try:
        resp = client.chat.completions.create(
            model=model,
            temperature=0,
            messages=messages,
            response_format={"type": "json_schema", "json_schema": RECEIPT_SCHEMA}
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error llamando a OpenAI: {e}")

    try:
        raw = resp.choices[0].message.content
        data = json.loads(raw)
        logger.info(f"🤖 IA extrajo {len(data.get('items', []))} items de la boleta")
    except Exception:
        raise HTTPException(status_code=500, detail="No se pudo parsear la respuesta JSON del modelo.")

    # 🎯 SISTEMA MEJORADO DE MAPEO DE PRODUCTOS
    inventory_items = []
    mapping_stats = {"ai_correct": 0, "mapped_fixed": 0, "fallback_otros": 0}
    
    for item in data.get("items", []):
        if item.get("is_inventario", False):
            original_name = item["NombreOriginal"]
            ai_product_type = item["Producto"]
            
            # 1. Verificar si la IA ya lo clasificó correctamente
            if ai_product_type in PRODUCT_TYPES:
                final_product_type = ai_product_type
                mapping_stats["ai_correct"] += 1
                logger.debug(f"✅ IA correcta: '{original_name}' -> '{final_product_type}'")
            else:
                # 2. Usar nuestro sistema de mapeo inteligente
                mapped_type = normalize_product_name(original_name)
                final_product_type = mapped_type
                
                if mapped_type != "Otros":
                    mapping_stats["mapped_fixed"] += 1
                    logger.info(f"🔧 Mapeo corregido: '{original_name}' (IA: '{ai_product_type}') -> '{final_product_type}'")
                else:
                    mapping_stats["fallback_otros"] += 1
                    logger.warning(f"⚠️ Fallback a 'Otros': '{original_name}' (IA: '{ai_product_type}')")
                
            inventory_items.append({
                "product_name": original_name,
                "product_type": final_product_type,
                "quantity": item["Cantidad"]
            })
    
    # Log de estadísticas para debugging
    logger.info(f"📊 Estadísticas de mapeo: IA correcta: {mapping_stats['ai_correct']}, "
               f"Corregidos: {mapping_stats['mapped_fixed']}, Otros: {mapping_stats['fallback_otros']}")
    
    return {
        "store": data.get("tienda", {}).get("sucursal_o_direccion"),
        "items": inventory_items,
        "mapping_stats": mapping_stats  # Para debugging en desarrollo
    }

@router.post("/receipts/confirm", response_model=ReceiptOut, tags=["receipts"])
def confirm_receipt(payload: ReceiptConfirmIn, db: Session = Depends(get_db)):
    from app.schemas import PRODUCT_TYPES
    from app.inventory_utils import process_receipt_items_to_inventory
    import logging
    
    logger = logging.getLogger(__name__)
    
    # Validación de tipos de producto
    for it in payload.items:
        if it.product_type not in PRODUCT_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid product_type: {it.product_type}")

    user_id = payload.user_id or DEMO_USER_ID

    try:
        # Crear receipt
        r = Receipt(
            user_id=user_id,
            store=payload.store,
        )
        db.add(r)
        db.flush()  # obtiene r.id

        # Crear items de la boleta
        receipt_items_data = []
        for it in payload.items:
            receipt_item = ReceiptItem(
                receipt_id=r.id,
                product_name=it.product_name,
                product_type=it.product_type,
                quantity=it.quantity,
            )
            db.add(receipt_item)
            
            # Preparar datos para inventario
            receipt_items_data.append({
                'product_name': it.product_name,
                'product_type': it.product_type,
                'quantity': it.quantity
            })

        # Procesar items al inventario
        logger.info(f"Procesando {len(receipt_items_data)} items al inventario para usuario {user_id}")
        
        inventory_results = process_receipt_items_to_inventory(
            db=db,
            user_id=user_id,
            receipt_items=receipt_items_data,
            store_name=payload.store,
            receipt_id=r.id
        )
        
        logger.info(f"Agregados {len(inventory_results)} productos al inventario")

        db.commit()
        db.refresh(r)
        
        # Agregar información de inventario a la respuesta
        r.inventory_items_added = len(inventory_results)
        
        return r
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error procesando boleta: {e}")
        raise HTTPException(status_code=500, detail=f"Error procesando boleta: {str(e)}")

@router.get("/receipts/{receipt_id}", response_model=ReceiptOut, tags=["receipts"])
def get_receipt(receipt_id: int, db: Session = Depends(get_db)):
    r = db.get(Receipt, receipt_id)
    if not r:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return r

@router.get("/receipts/user/{user_id}", response_model=List[ReceiptOut], tags=["receipts"])
def list_receipts_by_user(user_id: str, db: Session = Depends(get_db)):
    receipts = db.query(Receipt).filter(Receipt.user_id == user_id).all()
    if not receipts:
        raise HTTPException(status_code=404, detail="No receipts found for this user")
    return receipts

# ============================================================================
# ENDPOINTS PARA DEMO Y DEBUGGING
# ============================================================================

@router.post("/receipts/test-mapping", tags=["receipts", "demo"])
def test_product_mapping(product_name: str):
    """
    Endpoint para probar el mapeo de un producto específico.
    Útil durante la demo para verificar cómo se mapea un producto.
    """
    from app.product_mapping import normalize_product_name, clean_text, extract_keywords
    
    if not product_name or not product_name.strip():
        raise HTTPException(status_code=400, detail="product_name no puede estar vacío")
    
    # Procesar el producto
    cleaned = clean_text(product_name)
    keywords = extract_keywords(product_name)
    mapped_type = normalize_product_name(product_name)
    
    return {
        "original": product_name,
        "cleaned": cleaned,
        "keywords": keywords,
        "mapped_type": mapped_type,
        "is_valid": mapped_type != "Otros",
        "timestamp": "2024-01-01T00:00:00Z"  # Para debugging
    }

@router.post("/receipts/add-mapping", tags=["receipts", "demo"])
def add_custom_product_mapping(original_text: str, canonical_type: str):
    """
    Endpoint para agregar un mapeo personalizado durante la demo.
    Si un producto no se reconoce bien, puedes usar este endpoint para corregirlo.
    """
    from app.product_mapping import add_custom_mapping
    from app.schemas import PRODUCT_TYPES
    
    if not original_text or not original_text.strip():
        raise HTTPException(status_code=400, detail="original_text no puede estar vacío")
    
    if canonical_type not in PRODUCT_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"canonical_type debe ser uno de: {PRODUCT_TYPES}"
        )
    
    success = add_custom_mapping(original_text.strip(), canonical_type)
    
    if success:
        # Verificar que el mapeo funciona
        from app.product_mapping import normalize_product_name
        test_result = normalize_product_name(original_text)
        
        return {
            "success": True,
            "message": f"Mapeo agregado exitosamente",
            "original_text": original_text,
            "canonical_type": canonical_type,
            "verification": test_result,
            "works_correctly": test_result == canonical_type
        }
    else:
        raise HTTPException(status_code=500, detail="Error agregando el mapeo")

@router.get("/receipts/mapping-stats", tags=["receipts", "demo"])
def get_mapping_statistics():
    """
    Endpoint para obtener estadísticas del sistema de mapeo.
    Útil para mostrar en la demo qué tan robusto es el sistema.
    """
    from app.product_mapping import get_mapping_stats
    from app.schemas import PRODUCT_TYPES
    
    stats = get_mapping_stats()
    
    return {
        "total_mappings": stats['total_mappings'],
        "unique_canonical_types": stats['unique_types'],
        "available_canonical_types": len(PRODUCT_TYPES),
        "canonical_types": PRODUCT_TYPES,
        "type_distribution": stats['type_distribution'],
        "coverage_percentage": (stats['unique_types'] / len(PRODUCT_TYPES)) * 100
    }

@router.post("/receipts/batch-test-mapping", tags=["receipts", "demo"])
def batch_test_product_mapping(product_names: List[str]):
    """
    Endpoint para probar múltiples productos a la vez.
    Útil para validar una lista de productos antes de la demo.
    """
    from app.product_mapping import normalize_product_name
    
    if not product_names:
        raise HTTPException(status_code=400, detail="product_names no puede estar vacío")
    
    if len(product_names) > 50:
        raise HTTPException(status_code=400, detail="Máximo 50 productos por request")
    
    results = []
    stats = {"total": 0, "mapped_correctly": 0, "fallback_to_otros": 0}
    
    for product_name in product_names:
        if not product_name or not product_name.strip():
            continue
            
        mapped_type = normalize_product_name(product_name.strip())
        is_otros = mapped_type == "Otros"
        
        results.append({
            "original": product_name.strip(),
            "mapped_type": mapped_type,
            "needs_attention": is_otros
        })
        
        stats["total"] += 1
        if is_otros:
            stats["fallback_to_otros"] += 1
        else:
            stats["mapped_correctly"] += 1
    
    stats["success_rate"] = (stats["mapped_correctly"] / stats["total"]) * 100 if stats["total"] > 0 else 0
    
    return {
        "results": results,
        "statistics": stats,
        "recommendations": [
            f"Productos que necesitan mapeo personalizado: {stats['fallback_to_otros']}",
            f"Tasa de éxito: {stats['success_rate']:.1f}%",
            "Usa /receipts/add-mapping para corregir productos problemáticos"
        ]
    }
