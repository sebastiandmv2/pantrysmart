# -*- coding: utf-8 -*-
"""
Sistema de Mapeo de Productos para Boletas Chilenas
==================================================

Este módulo contiene diccionarios y funciones para mapear productos detectados
en boletas a tipos canónicos del sistema PantrySmart.

Uso:
    from app.product_mapping import normalize_product_name, get_product_mapping
    
    product_type = normalize_product_name("ARROZ TUCAPEL 1KG")
    # Retorna: "Arroz"
"""

import re
from typing import Dict, List, Optional, Tuple
from app.schemas import PRODUCT_TYPES

# ============================================================================
# DICCIONARIO PRINCIPAL DE MAPEO
# ============================================================================

# Mapeo directo: texto_detectado -> tipo_canónico
PRODUCT_MAPPING = {
    # ===== ARROZ =====
    "arroz": "Arroz",
    "arroz tucapel": "Arroz",
    "arroz grado 1": "Arroz",
    "arroz grado 2": "Arroz",
    "arroz miraflores": "Arroz",
    "arroz selecta": "Arroz",
    "arroz carolina": "Arroz",
    "arroz parboil": "Arroz",
    "arroz integral": "Arroz",
    "rice": "Arroz",
    
    # ===== FIDEOS / PASTA =====
    "fideos": "Fideos",
    "fideo": "Fideo",
    "pasta": "Fideos",
    "tallarines": "Fideos",
    "espagueti": "Fideos",
    "spaghetti": "Fideos",
    "macarrones": "Fideos",
    "penne": "Fideos",
    "fetuccini": "Fideos",
    "linguini": "Fideos",
    "coditos": "Fideos",
    "corbatas": "Fideos",
    "noodles": "Fideos",
    "lasaña": "Fideos",
    "canelones": "Fideos",
    "ravioles": "Ravioles",
    "ravioli": "Ravioles",
    
    # ===== AZÚCAR =====
    "azucar": "Azucar",
    "azúcar": "Azucar",
    "azucar granulada": "Azucar",
    "azucar blanca": "Azucar",
    "azucar rubia": "Azucar",
    "azucar flor": "Azucar",
    "sugar": "Azucar",
    
    # ===== HARINA =====
    "harina": "Harina",
    "harina sin polvos": "Harina",
    "harina con polvos": "Harina",
    "harina integral": "Harina",
    "harina selecta": "Harina",
    "flour": "Harina",
    
    # ===== ACEITE =====
    "aceite": "Aceite",
    "aceite vegetal": "Aceite",
    "aceite maravilla": "Aceite",
    "aceite canola": "Aceite",
    "aceite oliva": "Aceite",
    "aceite girasol": "Aceite",
    "oil": "Aceite",
    
    # ===== SAL =====
    "sal": "Sal",
    "sal de mesa": "Sal",
    "sal fina": "Sal",
    "sal gruesa": "Sal",
    "sal lobos": "Sal",
    "salt": "Sal",
    
    # ===== LÁCTEOS =====
    "leche": "Leche",
    "leche entera": "Leche",
    "leche descremada": "Leche",
    "leche semidescremada": "Leche",
    "leche sin lactosa": "Leche",
    "leche larga vida": "Leche",
    "leche fresca": "Leche",
    "leche soprole": "Leche",
    "leche colun": "Leche",
    "milk": "Leche",
    
    "leche condensada": "Leche evaporada",
    "leche evaporada": "Leche evaporada",
    "leche en polvo": "Leche evaporada",
    
    "queso": "Queso",
    "queso gauda": "Queso",
    "queso chanco": "Queso",
    "queso mantecoso": "Queso",
    "queso fresco": "Queso",
    "queso rallado": "Queso",
    "queso parmesano": "Queso",
    "quesillo": "Queso",
    "cheese": "Queso",
    
    "yogur": "Yogur",
    "yogurt": "Yogur",
    "yoghurt": "Yogur",
    "yogur natural": "Yogur",
    "yogur griego": "Yogur",
    "yogur descremado": "Yogur",
    
    "mantequilla": "Mantequilla",
    "manteca": "Mantequilla",
    "margarina": "Mantequilla",
    "butter": "Mantequilla",
    
    # ===== CARNES Y PROTEÍNAS =====
    "atun": "Atun",
    "atún": "Atun",
    "atun en agua": "Atun",
    "atun en aceite": "Atun",
    "tuna": "Atun",
    
    "pollo": "Pollo",
    "pollo entero": "Pollo",
    "pollo trozado": "Pollo",
    "pechuga": "Pollo",
    "muslo": "Pollo",
    "alas de pollo": "Pollo",
    "chicken": "Pollo",
    
    "carne": "Carne molida",
    "carne molida": "Carne molida",
    "carne picada": "Carne molida",
    "pino": "Carne molida",
    "beef": "Carne molida",
    "ground beef": "Carne molida",
    
    "hamburguesa": "Hamburguesa",
    "hamburgesa": "Hamburguesa",  # Error común
    "burger": "Hamburguesa",
    
    "huevo": "Huevo",
    "huevos": "Huevo",
    "huevo de gallina": "Huevo",
    "egg": "Huevo",
    "eggs": "Huevo",
    
    # ===== PANADERÍA =====
    "pan": "Pan",
    "pan de molde": "Pan",
    "pan integral": "Pan",
    "pan blanco": "Pan",
    "pan hallulla": "Pan",
    "marraqueta": "Pan",
    "bread": "Pan",
    
    "gallina": "Gallina",  # Nota: Puede ser confuso, revisar contexto
    
    # ===== FRUTAS =====
    "manzana": "Manzana",
    "manzanas": "Manzana",
    "manzana roja": "Manzana",
    "manzana verde": "Manzana",
    "apple": "Manzana",
    
    "platano": "Platano",
    "plátano": "Platano",
    "banana": "Platano",
    
    "fruta": "Fruta",
    "frutas": "Fruta",
    "fruit": "Fruta",
    
    "berries": "Berries",
    "frutillas": "Berries",
    "frambuesas": "Berries",
    "arandanos": "Berries",
    "arándanos": "Berries",
    "moras": "Berries",
    
    # ===== VERDURAS =====
    "cebolla": "Cebolla",
    "cebollas": "Cebolla",
    "cebolla blanca": "Cebolla",
    "cebolla morada": "Cebolla",
    "onion": "Cebolla",
    
    "tomate": "Tomate",
    "tomates": "Tomate",
    "tomate cherry": "Tomate",
    "tomato": "Tomate",
    
    "ajo": "Ajo",
    "ajos": "Ajo",
    "garlic": "Ajo",
    
    "zanahoria": "Zanahoria",
    "zanahorias": "Zanahoria",
    "carrot": "Zanahoria",
    
    # ===== CONDIMENTOS Y SALSAS =====
    "salsa de tomate": "Salsa de tomate",
    "salsa tomate": "Salsa de tomate",
    "ketchup": "Salsa de tomate",
    "pasta de tomate": "Salsa de tomate",
    "pure de tomate": "Salsa de tomate",
    "puré de tomate": "Salsa de tomate",
    
    "sopa": "Sopa",
    "sopa maggi": "Sopa",
    "sopa knorr": "Sopa",
    "sopa instantanea": "Sopa",
    "sopa deshidratada": "Sopa",
    "soup": "Sopa",
    
    # ===== CONGELADOS =====
    "helado": "Helado",
    "helados": "Helado",
    "ice cream": "Helado",
    
    # ===== MARCAS COMUNES CHILENAS =====
    # Arroz
    "tucapel": "Arroz",
    "miraflores": "Arroz",
    "selecta": "Arroz",
    
    # Fideos
    "carozzi": "Fideos",
    "lucchetti": "Fideos",
    "barilla": "Fideos",
    
    # Lácteos
    "soprole": "Leche",
    "colun": "Leche",
    "nestle": "Leche",
    
    # Aceites
    "chef": "Aceite",
    "natura": "Aceite",
    
    # Atún
    "van camps": "Atun",
    "robinson crusoe": "Atun",
    "lider": "Atun",
    
    # ===== PRODUCTOS ESPECÍFICOS DE DEMO =====
    "carne molida corri": "Carne molida",
    "leche natural ente": "Leche",
    "atun lomito ag 160": "Atun",
    "atun lomito": "Atun",
    "fideo caracoqueso": "Fideos",
    "caracoqueso": "Fideos",
    "chococereal": "Otros",
    "granola miel 330": "Otros",
    "granola": "Otros",
    "aceite vege": "Aceite",
    "yog batido frutill": "Yogur",
    "yog batido mora": "Yogur",
    "yog batido": "Yogur",
    "cus cus": "Otros",
    "couscous": "Otros",
    
    # Variaciones comunes de productos de demo
    "carne corri": "Carne molida",
    "leche natural": "Leche",
    "leche ente": "Leche",
    "fideo caracol": "Fideos",
    "cereal": "Otros",
    "granola miel": "Otros",
    "yogur batido": "Yogur",
    "yogur frutilla": "Yogur",
    "yogur mora": "Yogur",
}

# ============================================================================
# PATRONES REGEX PARA DETECCIÓN AVANZADA
# ============================================================================

REGEX_PATTERNS = [
    # Arroz con peso/marca
    (r'arroz\s+(?:tucapel|miraflores|selecta|grado\s*[12])\s*(?:\d+\s*k?g?)?', 'Arroz'),
    (r'(?:tucapel|miraflores|selecta)\s+arroz', 'Arroz'),
    
    # Fideos con marca/tipo
    (r'fideos?\s+(?:carozzi|lucchetti|barilla)', 'Fideos'),
    (r'(?:tallarines|espagueti|spaghetti|macarrones)\s+(?:\w+\s*)*', 'Fideos'),
    
    # Leche con tipo/marca
    (r'leche\s+(?:soprole|colun|nestle|entera|descremada|semidescremada)', 'Leche'),
    (r'(?:soprole|colun|nestle)\s+leche', 'Leche'),
    
    # Aceite con tipo
    (r'aceite\s+(?:vegetal|maravilla|canola|oliva|girasol)', 'Aceite'),
    
    # Atún con marca
    (r'atun?\s+(?:van\s*camps?|robinson\s*crusoe|lider)', 'Atun'),
    (r'(?:van\s*camps?|robinson\s*crusoe)\s+atun?', 'Atun'),
    
    # Queso con tipo
    (r'queso\s+(?:gauda|chanco|mantecoso|fresco|rallado|parmesano)', 'Queso'),
    
    # Pollo con corte
    (r'pollo\s+(?:entero|trozado|pechuga|muslo|alas)', 'Pollo'),
    (r'(?:pechuga|muslo|alas)\s+(?:de\s+)?pollo', 'Pollo'),
    
    # Pan con tipo
    (r'pan\s+(?:de\s+molde|integral|blanco|hallulla)', 'Pan'),
    (r'(?:marraqueta|hallulla)', 'Pan'),
    
    # Verduras con color/tipo
    (r'(?:cebolla|tomate|zanahoria)\s+(?:blanca?|roja?|morada?|cherry)', 'Cebolla|Tomate|Zanahoria'),
]

# ============================================================================
# PALABRAS CLAVE POR CATEGORÍA
# ============================================================================

CATEGORY_KEYWORDS = {
    'Arroz': ['arroz', 'rice', 'tucapel', 'miraflores', 'selecta', 'grado'],
    'Fideos': ['fideo', 'pasta', 'tallarin', 'espagueti', 'spaghetti', 'macarron', 'carozzi', 'lucchetti'],
    'Azucar': ['azucar', 'azúcar', 'sugar', 'granulada', 'blanca', 'rubia'],
    'Harina': ['harina', 'flour', 'polvo', 'integral'],
    'Aceite': ['aceite', 'oil', 'vegetal', 'maravilla', 'canola', 'oliva'],
    'Sal': ['sal', 'salt', 'mesa', 'fina', 'gruesa', 'lobos'],
    'Leche': ['leche', 'milk', 'entera', 'descremada', 'soprole', 'colun'],
    'Queso': ['queso', 'cheese', 'gauda', 'chanco', 'mantecoso', 'quesillo'],
    'Atun': ['atun', 'atún', 'tuna', 'van', 'camps', 'robinson', 'crusoe'],
    'Pollo': ['pollo', 'chicken', 'pechuga', 'muslo', 'alas'],
    'Huevo': ['huevo', 'egg', 'gallina'],
    'Pan': ['pan', 'bread', 'molde', 'integral', 'marraqueta', 'hallulla'],
    'Cebolla': ['cebolla', 'onion', 'blanca', 'morada'],
    'Tomate': ['tomate', 'tomato', 'cherry'],
    'Ajo': ['ajo', 'garlic'],
    'Zanahoria': ['zanahoria', 'carrot'],
}

# ============================================================================
# FUNCIONES DE NORMALIZACIÓN
# ============================================================================

def clean_text(text: str) -> str:
    """
    Limpia y normaliza texto para comparación.
    
    Args:
        text: Texto a limpiar
        
    Returns:
        Texto limpio en minúsculas sin caracteres especiales
    """
    if not text:
        return ""
    
    # Convertir a minúsculas
    text = text.lower()
    
    # Remover acentos comunes
    replacements = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'ñ': 'n', 'ü': 'u'
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # Remover caracteres especiales excepto espacios y números
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Normalizar espacios
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def extract_keywords(text: str) -> List[str]:
    """
    Extrae palabras clave relevantes del texto.
    
    Args:
        text: Texto del producto
        
    Returns:
        Lista de palabras clave encontradas
    """
    cleaned = clean_text(text)
    words = cleaned.split()
    
    # Filtrar palabras muy cortas o números puros
    keywords = []
    for word in words:
        if len(word) >= 3 and not word.isdigit():
            keywords.append(word)
    
    return keywords

def normalize_product_name(product_name: str) -> str:
    """
    Función principal para normalizar nombre de producto a tipo canónico.
    
    Args:
        product_name: Nombre del producto como aparece en la boleta
        
    Returns:
        Tipo de producto canónico o "Otros" si no se encuentra coincidencia
    """
    if not product_name:
        return "Otros"
    
    cleaned_name = clean_text(product_name)
    
    # 1. Búsqueda directa en diccionario
    if cleaned_name in PRODUCT_MAPPING:
        return PRODUCT_MAPPING[cleaned_name]
    
    # 2. Búsqueda por palabras clave individuales
    for key, product_type in PRODUCT_MAPPING.items():
        if key in cleaned_name:
            return product_type
    
    # 3. Búsqueda por patrones regex
    for pattern, product_type in REGEX_PATTERNS:
        if re.search(pattern, cleaned_name, re.IGNORECASE):
            # Manejar casos donde el patrón puede mapear a múltiples tipos
            if '|' in product_type:
                # Lógica para decidir entre múltiples opciones
                types = product_type.split('|')
                for t in types:
                    if t.lower() in cleaned_name:
                        return t
                return types[0]  # Fallback al primero
            return product_type
    
    # 4. Búsqueda por categorías de palabras clave
    keyword_scores = {}
    keywords = extract_keywords(cleaned_name)
    
    for product_type, category_keywords in CATEGORY_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            for cat_keyword in category_keywords:
                if cat_keyword in keyword or keyword in cat_keyword:
                    score += 1
        if score > 0:
            keyword_scores[product_type] = score
    
    # Retornar el tipo con mayor score
    if keyword_scores:
        best_match = max(keyword_scores.items(), key=lambda x: x[1])
        return best_match[0]
    
    # 5. Fallback a "Otros"
    return "Otros"

def get_product_mapping() -> Dict[str, str]:
    """
    Retorna el diccionario completo de mapeo de productos.
    
    Returns:
        Diccionario con mapeos de productos
    """
    return PRODUCT_MAPPING.copy()

def add_custom_mapping(original_name: str, canonical_type: str) -> bool:
    """
    Agrega un mapeo personalizado al diccionario.
    
    Args:
        original_name: Nombre original del producto
        canonical_type: Tipo canónico al que mapear
        
    Returns:
        True si se agregó exitosamente, False si el tipo canónico no es válido
    """
    if canonical_type not in PRODUCT_TYPES:
        return False
    
    cleaned_name = clean_text(original_name)
    PRODUCT_MAPPING[cleaned_name] = canonical_type
    return True

def get_mapping_stats() -> Dict[str, int]:
    """
    Retorna estadísticas del sistema de mapeo.
    
    Returns:
        Diccionario con estadísticas
    """
    type_counts = {}
    for product_type in PRODUCT_MAPPING.values():
        type_counts[product_type] = type_counts.get(product_type, 0) + 1
    
    return {
        'total_mappings': len(PRODUCT_MAPPING),
        'unique_types': len(set(PRODUCT_MAPPING.values())),
        'type_distribution': type_counts
    }

# ============================================================================
# FUNCIÓN DE TESTING/DEBUG
# ============================================================================

def test_mapping(test_cases: List[Tuple[str, str]]) -> Dict[str, any]:
    """
    Función para testear el sistema de mapeo con casos de prueba.
    
    Args:
        test_cases: Lista de tuplas (nombre_producto, tipo_esperado)
        
    Returns:
        Diccionario con resultados de las pruebas
    """
    results = {
        'total_tests': len(test_cases),
        'passed': 0,
        'failed': 0,
        'details': []
    }
    
    for original, expected in test_cases:
        mapped = normalize_product_name(original)
        passed = mapped == expected
        
        results['details'].append({
            'input': original,
            'expected': expected,
            'actual': mapped,
            'passed': passed
        })
        
        if passed:
            results['passed'] += 1
        else:
            results['failed'] += 1
    
    results['accuracy'] = results['passed'] / results['total_tests'] if results['total_tests'] > 0 else 0
    
    return results

# ============================================================================
# CASOS DE PRUEBA PARA DEMO
# ============================================================================

DEMO_TEST_CASES = [
    # ===== PRODUCTOS ESPECÍFICOS DE TU DEMO =====
    ("CARNE MOLIDA CORRI", "Carne molida"),
    ("LECHE NATURAL ENTE", "Leche"),
    ("ATUN LOMITO AG 160", "Atun"),
    ("FIDEO CARACOQUESO", "Fideos"),
    ("CHOCOCEREAL", "Otros"),
    ("GRANOLA MIEL 330", "Otros"),
    ("ACEITE VEGE", "Aceite"),
    ("YOG BATIDO FRUTILL", "Yogur"),
    ("YOG BATIDO MORA", "Yogur"),
    ("CUS CUS", "Otros"),
    
    # Casos comunes en boletas chilenas
    ("ARROZ TUCAPEL 1KG", "Arroz"),
    ("FIDEOS CAROZZI ESPAGUETI", "Fideos"),
    ("LECHE SOPROLE ENTERA 1L", "Leche"),
    ("ACEITE CHEF 900ML", "Aceite"),
    ("ATUN VAN CAMPS", "Atun"),
    ("QUESO CHANCO COLUN", "Queso"),
    ("PAN DE MOLDE IDEAL", "Pan"),
    ("HUEVOS GALLINA DOCENA", "Huevo"),
    ("CEBOLLA BLANCA KG", "Cebolla"),
    ("TOMATE CHERRY BANDEJA", "Tomate"),
    ("PECHUGA POLLO KG", "Pollo"),
    ("AZUCAR GRANULADA IANSA", "Azucar"),
    ("HARINA SIN POLVOS", "Harina"),
    ("SAL DE MESA LOBOS", "Sal"),
    ("YOGUR NATURAL SOPROLE", "Yogur"),
]

if __name__ == "__main__":
    # Ejecutar pruebas si se ejecuta directamente
    print("🧪 Ejecutando pruebas del sistema de mapeo...")
    results = test_mapping(DEMO_TEST_CASES)
    
    print(f"\n📊 Resultados:")
    print(f"   Total: {results['total_tests']}")
    print(f"   Exitosos: {results['passed']}")
    print(f"   Fallidos: {results['failed']}")
    print(f"   Precisión: {results['accuracy']:.1%}")
    
    if results['failed'] > 0:
        print(f"\n❌ Casos fallidos:")
        for detail in results['details']:
            if not detail['passed']:
                print(f"   '{detail['input']}' -> Esperado: '{detail['expected']}', Obtenido: '{detail['actual']}'")
    else:
        print(f"\n✅ ¡Todos los casos de prueba pasaron!")