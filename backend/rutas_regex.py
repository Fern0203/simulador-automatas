from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import re

# Creamos el enrutador con prefijo automático para todas sus rutas
router = APIRouter(prefix="/api/regex", tags=["Expresiones Regulares"])

# ==========================================
# MODELOS PYDANTIC
# ==========================================

class RegexRequest(BaseModel):
    regex: str = Field(..., description="Expresión regular formal, ej: (a|b)*abb")

class RegexValidarCadenaRequest(BaseModel):
    regex: str
    cadena: str = Field(default="", description="Cadena a comprobar")

class AutomataResponse(BaseModel):
    estados: List[str]
    alfabeto: List[str]
    estado_inicial: str
    estados_aceptacion: List[str]
    transiciones: Dict[str, Dict[str, List[str]]]
    mensaje: Optional[str] = "AFN generado exitosamente mediante Thompson"

class ValidacionRegexResponse(BaseModel):
    valida: bool
    mensaje: str
    cadena: str
    regex: str


# ==========================================
# ENDPOINTS
# ==========================================

@router.post("/generar-afn", response_model=AutomataResponse)
def endpoint_regex_a_afn(peticion: RegexRequest):
    """
    Recibe una expresión regular y retorna el AFN equivalente
    siguiendo la estructura estándar de 5-tupla compatible con grafo.js
    """
    expresion = peticion.regex.strip()
    
    if not expresion:
        raise HTTPException(status_code=400, detail="La expresión regular no puede estar vacía.")
    
    try:
        # NOTA: Aquí conectaremos la función de Froilan cuando esté lista:
        # from backend.regex_thompson import thompson_regex_a_afn
        # return thompson_regex_a_afn(expresion)
        
        # MOCK TEMPORAL de desarrollo para habilitar el trabajo de frontend:
        return {
            "estados": ["q0", "q1", "q2", "q3"],
            "alfabeto": ["a", "b"],
            "estado_inicial": "q0",
            "estados_aceptacion": ["q3"],
            "transiciones": {
                "q0": {"a": ["q1"], "ε": ["q2"]},
                "q1": {"b": ["q3"]},
                "q2": {"b": ["q3"]},
                "q3": {}
            },
            "mensaje": f"AFN generado (Mock de prueba para regex: '{expresion}')"
        }

    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Error al procesar la expresión regular: {str(e)}")


@router.post("/validar-cadena", response_model=ValidacionRegexResponse)
def endpoint_validar_cadena_regex(peticion: RegexValidarCadenaRequest):
    """
    Valida si una cadena cumple con la expresión regular.
    """
    regex_ingresada = peticion.regex.strip()
    cadena_evaluar = peticion.cadena.strip()

    if not regex_ingresada:
        raise HTTPException(status_code=400, detail="La expresión regular es obligatoria.")

    try:
        es_valida = bool(re.fullmatch(regex_ingresada, cadena_evaluar))
        return {
            "valida": es_valida,
            "mensaje": "Cadena aceptada por la regex" if es_valida else "Cadena rechazada por la regex",
            "cadena": cadena_evaluar,
            "regex": regex_ingresada
        }
    except re.error as e:
        raise HTTPException(status_code=400, detail=f"Sintaxis de expresión regular inválida: {str(e)}")