from fastapi import APIRouter, UploadFile, File, HTTPException
from openai import OpenAI
import os, base64, json

router = APIRouter()

SYSTEM_MSG = (
  "Eres un extractor de boletas de supermercado (Chile y LATAM). "
  "Devuelve SOLO JSON válido que cumpla el esquema.\n\n"
  "REGLAS:\n"
  "- Detecta cantidad y precio unitario cuando aparezca un patrón de multiplicación en CUALQUIER ORDEN: "
  "  '2x1590', '2 x 1.590', '1.590x2', '1.590 x 2', '2X $1,590', etc. "
  "  Normaliza: quantity=N (entero), unit_price=P (entero sin puntos/$, CLP), total_price=N*P.\n"
  "- Si no aparece patrón explícito, usa la línea total como total_price e infiere unit_price si hay indicios.\n"
  "- Montos SIEMPRE como enteros en CLP. Fecha en YYYY-MM-DD. "
  "Método de pago: TBK CREDITO/DEBITO ⇒ 'Tarjeta de Crédito'/'Tarjeta de Débito'.\n"
  "- La propiedad 'category' es OBLIGATORIA. Usa solo una de: "
  "['Alimentos','Bebidas','Higiene','Limpieza','Salud','Mascotas','Hogar','Bebé','Alcohol','Otros'].\n"
  "- No inventes productos que no se lean. Ignora líneas de lealtad, mensajes, subtotales duplicados."
  "\n\nDETALLES IMPORTANTES:\n"
  "- El patrón de cantidad puede estar ANTES o DESPUÉS del producto e incluso en la LÍNEA ANTERIOR. "
  "  Ejemplos válidos: '2x1.990 HIELO ...', 'HIELO ... 1.990x2', '2 X $1,990', '$1.990 x 2'.\n"
  "- Si ves el precio TOTAL de la línea pero no el patrón, y el total es divisible por un entero pequeño (2–10), "
  "  asume quantity=N y unit_price=total/N.\n"
  "- Asigna SIEMPRE una categoría de este set: "
  "['Alimentos','Bebidas','Higiene','Limpieza','Salud','Mascotas','Hogar','Bebé','Alcohol','Otros'].\n"
  "- Ejemplos de mapeo rápido: CONFORT/PAPEL→Higiene; HIELO→Alimentos; BEBIDA/JUGO/AGUA→Bebidas."
)

RECEIPT_SCHEMA = {
    "name": "receipt_schema",
    "schema": {
        "type": "object",
        "properties": {
            "store": {"type": "string"},
            "date": {"type": "string", "description": "YYYY-MM-DD"},
            "time": {"type": "string"},
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "product_name": {"type": "string"},
                        "category": {
                            "type": "string",
                            "description": "Una de: Alimentos, Bebidas, Higiene, Limpieza, Salud, Mascotas, Hogar, Bebé, Alcohol, Otros"
                        },
                        "quantity": {"type": "integer"},
                        "unit_price": {"type": "integer"},
                        "total_price": {"type": "integer"}
                    },
                    "required": ["product_name", "category", "quantity", "unit_price", "total_price"],
                    "additionalProperties": False
                }
            },
            "subtotal": {"type": "integer"},
            "iva": {"type": "integer"},
            "total": {"type": "integer"},
            "payment_method": {"type": "string"}
        },
        "required": ["store", "date", "time", "items", "subtotal", "iva", "total"],
        "additionalProperties": False
    }
}

def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("utf-8")

@router.post("/extract-receipt")
async def extract_receipt(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Se requiere una imagen (content-type image/*).")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY no configurado en el entorno.")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    client = OpenAI(api_key=api_key)

    image_bytes = await file.read()
    image_b64 = _b64(image_bytes)

    try:
        resp = client.chat.completions.create(
            model=model,
            temperature=0,
            messages=[
                {"role": "system", "content": SYSTEM_MSG},
                {"role": "user", "content": [
                    {"type": "text", "text": "Extrae la boleta como JSON, siguiendo las reglas."},
                    {"type": "image_url",
                     "image_url": {"url": f"data:{file.content_type};base64,{image_b64}"}}
                ]}
            ],
            response_format={"type": "json_schema", "json_schema": RECEIPT_SCHEMA}
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error llamando a OpenAI: {e}")

    try:
        raw = resp.choices[0].message.content
        data = json.loads(raw)
    except Exception:
        raise HTTPException(status_code=500, detail="No se pudo parsear la respuesta JSON del modelo.")

    # Remover campos no deseados al final
    for k in ["iva", "total", "payment_method"]:
        data.pop(k, None)

    return data
