# -*- coding: utf-8 -*-
"""
Configuración de Productos Específicos para DEMO
===============================================

Este archivo contiene mapeos específicos para productos que aparecerán
en tu demo. Agrega aquí cualquier producto que no esté siendo reconocido
correctamente.

INSTRUCCIONES:
1. Ejecuta tu demo
2. Si algún producto no se reconoce bien, agrégalo aquí
3. Reinicia la API
4. El producto debería funcionar perfectamente

Formato:
    "texto_que_aparece_en_boleta": "tipo_canonico"
"""

# ============================================================================
# MAPEOS ESPECÍFICOS PARA TU DEMO
# ============================================================================

DEMO_SPECIFIC_MAPPINGS = {
    # ===== PRODUCTOS ESPECÍFICOS DE TU BOLETA DE DEMO =====
    "carne molida corri": "Carne molida",
    "leche natural ente": "Leche", 
    "atun lomito ag 160": "Atun",
    "fideo caracoqueso": "Fideos",
    "chococereal": "Otros",  # Mapear a "Otros" ya que "Cereal" no está en tipos canónicos
    "granola miel 330": "Otros",  # Mapear a "Otros" ya que "Granola" no está en tipos canónicos  
    "aceite vege": "Aceite",
    "yog batido frutill": "Yogur",
    "yog batido mora": "Yogur",
    "cus cus": "Otros",  # Mapear a "Otros" ya que "Cus Cus" no está en tipos canónicos
    
    # Variaciones adicionales de los productos de tu demo
    "carne molida": "Carne molida",
    "leche natural": "Leche",
    "leche entera": "Leche",
    "atun lomito": "Atun",
    "fideo caracol": "Fideos",
    "caracoqueso": "Fideos",
    "cereal": "Otros",
    "granola": "Otros",
    "aceite vegetal": "Aceite",
    "yogur batido": "Yogur",
    "yogur frutilla": "Yogur",
    "yogur mora": "Yogur",
    "couscous": "Otros",
    
    # Productos comunes en supermercados chilenos que podrían aparecer
    "arroz grado 1": "Arroz",
    "arroz grado 2": "Arroz", 
    "arroz parboil": "Arroz",
    "arroz integral": "Arroz",
    
    "fideos corbatas": "Fideos",
    "fideos coditos": "Fideos",
    "fideos mostachones": "Fideos",
    "fideos caracolas": "Fideos",
    
    "leche descremada": "Leche",
    "leche semidescremada": "Leche",
    "leche sin lactosa": "Leche",
    "leche larga vida": "Leche",
    
    "aceite vegetal": "Aceite",
    "aceite maravilla": "Aceite",
    "aceite canola": "Aceite",
    "aceite de oliva": "Aceite",
    
    "queso gauda": "Queso",
    "queso chanco": "Queso",
    "queso mantecoso": "Queso",
    "queso rallado": "Queso",
    
    "pan de molde": "Pan",
    "pan integral": "Pan",
    "pan blanco": "Pan",
    "hallulla": "Pan",
    "marraqueta": "Pan",
    
    "pechuga de pollo": "Pollo",
    "muslo de pollo": "Pollo",
    "alas de pollo": "Pollo",
    "pollo entero": "Pollo",
    "pollo trozado": "Pollo",
    
    "carne molida": "Carne molida",
    "carne picada": "Carne molida",
    "pino para empanadas": "Carne molida",
    
    "huevos de gallina": "Huevo",
    "huevos extra": "Huevo",
    "huevos grandes": "Huevo",
    
    "cebolla blanca": "Cebolla",
    "cebolla morada": "Cebolla",
    "cebolla amarilla": "Cebolla",
    
    "tomate redondo": "Tomate",
    "tomate cherry": "Tomate",
    "tomate italiano": "Tomate",
    
    "zanahoria baby": "Zanahoria",
    "zanahoria grande": "Zanahoria",
    
    "yogur natural": "Yogur",
    "yogur griego": "Yogur",
    "yogur descremado": "Yogur",
    "yogur con frutas": "Yogur",
    
    "mantequilla con sal": "Mantequilla",
    "mantequilla sin sal": "Mantequilla",
    "margarina": "Mantequilla",
    
    "atun en agua": "Atun",
    "atun en aceite": "Atun",
    "atun desmenuzado": "Atun",
    
    "salsa de tomate": "Salsa de tomate",
    "pasta de tomate": "Salsa de tomate",
    "pure de tomate": "Salsa de tomate",
    "ketchup": "Salsa de tomate",
    
    "sopa instantanea": "Sopa",
    "sopa deshidratada": "Sopa",
    "crema de pollo": "Sopa",
    "crema de verduras": "Sopa",
    
    # Marcas específicas que podrían aparecer
    "tucapel": "Arroz",
    "miraflores": "Arroz", 
    "selecta": "Arroz",
    
    "carozzi": "Fideos",
    "lucchetti": "Fideos",
    "barilla": "Fideos",
    
    "soprole": "Leche",
    "colun": "Leche",
    "nestle": "Leche",
    
    "chef": "Aceite",
    "natura": "Aceite",
    "cocinero": "Aceite",
    
    "van camps": "Atun",
    "robinson crusoe": "Atun",
    "angelmo": "Atun",
    
    "ideal": "Pan",
    "bimbo": "Pan",
    "fuchs": "Pan",
    
    # Productos con errores comunes de OCR
    "arrqz": "Arroz",
    "fideds": "Fideos", 
    "lechf": "Leche",
    "acelte": "Aceite",
    "atjn": "Atun",
    "quesc": "Queso",
    "huevds": "Huevo",
    "cebdlla": "Cebolla",
    "tpmate": "Tomate",
    
    # Abreviaciones comunes
    "arr": "Arroz",
    "fid": "Fideos",
    "lch": "Leche",  # Menos común pero posible
    "act": "Aceite",  # Menos común pero posible
}

# ============================================================================
# MAPEOS DE MARCAS A PRODUCTOS
# ============================================================================

BRAND_TO_PRODUCT_MAPPINGS = {
    # Cuando solo aparece la marca, inferir el producto más común
    "tucapel": "Arroz",
    "miraflores": "Arroz",
    "selecta": "Arroz",
    
    "carozzi": "Fideos",
    "lucchetti": "Fideos",
    "barilla": "Fideos",
    
    "soprole": "Leche",  # Podría ser leche, queso, yogur - defaultear a leche
    "colun": "Leche",
    "nestle": "Leche",
    
    "chef": "Aceite",
    "natura": "Aceite",
    
    "van camps": "Atun",
    "robinson crusoe": "Atun",
    
    "ideal": "Pan",
    "bimbo": "Pan",
    
    "maggi": "Sopa",
    "knorr": "Sopa",
}

# ============================================================================
# PATRONES ESPECÍFICOS PARA DEMO
# ============================================================================

DEMO_REGEX_PATTERNS = [
    # Patrones específicos que podrían aparecer en tu boleta
    (r'(?:arroz|rice)\s+(?:tucapel|miraflores|selecta)', 'Arroz'),
    (r'(?:tucapel|miraflores|selecta)\s+(?:arroz|rice)', 'Arroz'),
    
    (r'(?:fideos?|pasta)\s+(?:carozzi|lucchetti|barilla)', 'Fideos'),
    (r'(?:carozzi|lucchetti|barilla)\s+(?:fideos?|pasta)', 'Fideos'),
    
    (r'(?:leche|milk)\s+(?:soprole|colun|nestle)', 'Leche'),
    (r'(?:soprole|colun|nestle)\s+(?:leche|milk)', 'Leche'),
    
    (r'(?:aceite|oil)\s+(?:chef|natura|cocinero)', 'Aceite'),
    (r'(?:chef|natura|cocinero)\s+(?:aceite|oil)', 'Aceite'),
    
    (r'(?:atun|tuna)\s+(?:van\s*camps?|robinson|angelmo)', 'Atun'),
    (r'(?:van\s*camps?|robinson|angelmo)\s+(?:atun|tuna)', 'Atun'),
    
    (r'(?:pan|bread)\s+(?:ideal|bimbo|fuchs)', 'Pan'),
    (r'(?:ideal|bimbo|fuchs)\s+(?:pan|bread)', 'Pan'),
    
    (r'(?:queso|cheese)\s+(?:soprole|colun|surlat)', 'Queso'),
    (r'(?:soprole|colun|surlat)\s+(?:queso|cheese)', 'Queso'),
    
    # Patrones con pesos y medidas
    (r'arroz.*?(?:\d+\s*k?g)', 'Arroz'),
    (r'fideos.*?(?:\d+\s*g)', 'Fideos'),
    (r'leche.*?(?:\d+\s*(?:ml|lt|l))', 'Leche'),
    (r'aceite.*?(?:\d+\s*(?:ml|cc|lt))', 'Aceite'),
    
    # Patrones para productos con cortes/tipos
    (r'(?:pechuga|muslo|alas).*?pollo', 'Pollo'),
    (r'pollo.*?(?:pechuga|muslo|alas|entero|trozado)', 'Pollo'),
    
    (r'(?:cebolla|onion).*?(?:blanca|morada|amarilla)', 'Cebolla'),
    (r'(?:tomate|tomato).*?(?:cherry|redondo|italiano)', 'Tomate'),
]

# ============================================================================
# FUNCIÓN PARA APLICAR MAPEOS DE DEMO
# ============================================================================

def apply_demo_mappings():
    """
    Aplica los mapeos específicos de demo al sistema principal.
    Llama esta función al iniciar la API para cargar los mapeos personalizados.
    """
    from app.product_mapping import PRODUCT_MAPPING, REGEX_PATTERNS
    
    # Agregar mapeos específicos
    PRODUCT_MAPPING.update(DEMO_SPECIFIC_MAPPINGS)
    PRODUCT_MAPPING.update(BRAND_TO_PRODUCT_MAPPINGS)
    
    # Agregar patrones regex específicos
    REGEX_PATTERNS.extend(DEMO_REGEX_PATTERNS)
    
    print(f"✅ Aplicados {len(DEMO_SPECIFIC_MAPPINGS)} mapeos específicos de demo")
    print(f"✅ Aplicados {len(BRAND_TO_PRODUCT_MAPPINGS)} mapeos de marcas")
    print(f"✅ Aplicados {len(DEMO_REGEX_PATTERNS)} patrones regex adicionales")

# ============================================================================
# FUNCIÓN PARA AGREGAR MAPEOS EN TIEMPO REAL
# ============================================================================

def add_demo_mapping_runtime(original_text: str, canonical_type: str) -> bool:
    """
    Agrega un mapeo específico en tiempo de ejecución.
    Útil para corregir productos durante la demo.
    
    Args:
        original_text: Texto que aparece en la boleta
        canonical_type: Tipo canónico al que debe mapear
        
    Returns:
        True si se agregó exitosamente
    """
    from app.product_mapping import add_custom_mapping
    from app.schemas import PRODUCT_TYPES
    
    if canonical_type not in PRODUCT_TYPES:
        print(f"❌ Error: '{canonical_type}' no es un tipo válido")
        return False
    
    success = add_custom_mapping(original_text, canonical_type)
    if success:
        print(f"✅ Mapeo agregado en tiempo real: '{original_text}' -> '{canonical_type}'")
        
        # También agregarlo a nuestros mapeos de demo para persistencia
        DEMO_SPECIFIC_MAPPINGS[original_text.lower()] = canonical_type
        
    return success

# ============================================================================
# CASOS DE PRUEBA ESPECÍFICOS PARA TU DEMO
# ============================================================================

DEMO_TEST_PRODUCTS = [
    # ===== PRODUCTOS ESPECÍFICOS DE TU BOLETA DE DEMO =====
    "CARNE MOLIDA CORRI",
    "LECHE NATURAL ENTE", 
    "ATUN LOMITO AG 160",
    "FIDEO CARACOQUESO",
    "CHOCOCEREAL",
    "GRANOLA MIEL 330",
    "ACEITE VEGE",
    "YOG BATIDO FRUTILL",
    "YOG BATIDO MORA",
    "CUS CUS",
    
    # Productos que definitivamente deberían funcionar en tu demo
    "ARROZ TUCAPEL GRADO 1 1KG",
    "FIDEOS CAROZZI ESPAGUETI 400G", 
    "LECHE SOPROLE ENTERA 1L",
    "ACEITE CHEF VEGETAL 900ML",
    "ATUN VAN CAMPS EN AGUA",
    "QUESO CHANCO COLUN",
    "PAN DE MOLDE IDEAL",
    "HUEVOS GALLINA DOCENA",
    "CEBOLLA BLANCA KG",
    "TOMATE REDONDO KG",
    "PECHUGA POLLO SIN HUESO",
    "YOGUR NATURAL SOPROLE",
    "MANTEQUILLA CON SAL",
    "AJO NACIONAL KG",
    "ZANAHORIA A GRANEL",
    "SALSA DE TOMATE MAGGI",
]

def test_demo_products():
    """
    Prueba todos los productos específicos de la demo.
    Ejecuta esto antes de tu presentación para asegurar que todo funciona.
    """
    from app.product_mapping import normalize_product_name
    
    print("🎯 PROBANDO PRODUCTOS ESPECÍFICOS DE DEMO")
    print("=" * 50)
    
    all_passed = True
    for product in DEMO_TEST_PRODUCTS:
        result = normalize_product_name(product)
        if result == "Otros":
            print(f"❌ '{product}' -> '{result}' (necesita mapeo)")
            all_passed = False
        else:
            print(f"✅ '{product}' -> '{result}'")
    
    if all_passed:
        print(f"\n🎉 ¡Todos los productos de demo están listos!")
    else:
        print(f"\n⚠️ Algunos productos necesitan mapeos adicionales.")
        print(f"💡 Agrégalos en DEMO_SPECIFIC_MAPPINGS en este archivo.")
    
    return all_passed

if __name__ == "__main__":
    # Aplicar mapeos y probar
    apply_demo_mappings()
    test_demo_products()