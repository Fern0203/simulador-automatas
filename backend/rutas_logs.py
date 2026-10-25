"""
Módulo de Rutas y API para Análisis de Logs

"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import re

router = APIRouter(prefix="/api/logs", tags=["Análisis de Logs"])

# ==========================================
# 1. PATRONES BASE Y DICCIONARIOS
# ==========================================

PATRONES_CONFIGURADOS = {
    "servidor": {
        "nombre": "Servidor Estándar ([NIVEL] FECHA IP - MENSAJE)",
        "regex": r"^\[(?P<nivel>[A-Z]+)\]\s+(?P<fecha>\d{4}-\d{2}-\d{2})\s+(?P<ip>\d{1,3}(?:\.\d{1,3}){3})\s+-\s+(?P<mensaje>.+)$",
        "campo_clave": "nivel",
        "diccionario_defecto": ["INFO", "WARN", "WARNING", "ERROR"]
    },
    "apache": {
        "nombre": "Servidor Web Apache (IP - [FECHA] \"METODO RUTA\" STATUS)",
        "regex": r"^(?P<ip>\d{1,3}(?:\.\d{1,3}){3})\s+-\s+\[(?P<fecha>[^\]]+)\]\s+\"(?P<metodo>[A-Z]+)\s+(?P<ruta>\S+)[^\"]*\"\s+(?P<status>\d{3})$",
        "campo_clave": "metodo",
        "diccionario_defecto": ["GET", "POST", "PUT", "DELETE", "PATCH"]
    },
    "iso": {
        "nombre": "Eventos ISO (FECHA_HORA [NIVEL] MENSAJE)",
        "regex": r"^(?P<fecha>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\s+\[(?P<nivel>[A-Z]+)\]\s+(?P<mensaje>.+)$",
        "campo_clave": "nivel",
        "diccionario_defecto": ["DEBUG", "INFO", "WARN", "ERROR"]
    }
}

# ==========================================
# 2. MODELOS PYDANTIC
# ==========================================

class DetalleLineaLog(BaseModel):
    numero_linea: int
    linea_original: str
    estado: str  # 'VALIDA', 'FUERA_DICCIONARIO', 'ERROR_FORMATO'
    es_valida: bool
    diagnostico: str
    componentes: Dict[str, Any]

class RespuestaAnalisisLogs(BaseModel):
    total_lineas: int
    lineas_validas: int
    lineas_fuera_diccionario: int
    lineas_error_formato: int
    regex_utilizada: str
    diccionario_utilizado: List[str]
    detalles: List[DetalleLineaLog]
    mensaje: str


# ==========================================
# 3. ENDPOINTS
# ==========================================

@router.get("/patrones")
def obtener_patrones():
    """Retorna los patrones estándar disponibles para poblar el selector en el frontend."""
    return {
        clave: {
            "nombre": valor["nombre"],
            "regex": valor["regex"],
            "diccionario_defecto": valor["diccionario_defecto"]
        }
        for clave, valor in PATRONES_CONFIGURADOS.items()
    }


@router.post("/analizar", response_model=RespuestaAnalisisLogs)
async def endpoint_analizar_logs(
    patron_tipo: str = Form("servidor", description="'servidor', 'apache', 'iso' o 'custom'"),
    regex_custom: Optional[str] = Form(None, description="Regex si patron_tipo es 'custom'"),
    diccionario_custom: Optional[str] = Form(None, description="Tokens válidos separados por coma"),
    texto_logs: Optional[str] = Form(None, description="Contenido de logs pegado en el textarea"),
    archivo: Optional[UploadFile] = File(None, description="Archivo .log o .txt subido")
):
    """
    Analiza logs validando estructura por Regex y tokens por diccionario.
    """
    contenido = ""

    # 1. Extraer contenido de archivo o texto directo
    if archivo and archivo.filename:
        bytes_data = await archivo.read()
        contenido = bytes_data.decode("utf-8", errors="replace")
    elif texto_logs and texto_logs.strip():
        contenido = texto_logs
    else:
        raise HTTPException(
            status_code=400,
            detail="Debes ingresar texto en el área de logs o subir un archivo de texto."
        )

    lineas = [l for l in contenido.splitlines() if l.strip()]
    if not lineas:
        raise HTTPException(status_code=400, detail="El contenido a procesar está vacío.")

    # 2. Asignar patrón y diccionario
    if patron_tipo in PATRONES_CONFIGURADOS:
        config = PATRONES_CONFIGURADOS[patron_tipo]
        regex_usar = config["regex"]
        campo_clave = config["campo_clave"]
        diccionario = config["diccionario_defecto"]
    else:
        if not regex_custom or not regex_custom.strip():
            raise HTTPException(
                status_code=400,
                detail="Debes ingresar una expresión regular al seleccionar el modo personalizado."
            )
        regex_usar = regex_custom.strip()
        campo_clave = "nivel"
        diccionario = []

    # Sobrescribir diccionario si el usuario envió tokens personalizados
    if diccionario_custom and diccionario_custom.strip():
        diccionario = [token.strip().upper() for token in diccionario_custom.split(",") if token.strip()]
    else:
        diccionario = [t.upper() for t in diccionario]

    # Validar compilación de la expresión regular
    try:
        patron_compilado = re.compile(regex_usar)
    except re.error as e:
        raise HTTPException(status_code=400, detail=f"Sintaxis de expresión regular inválida: {str(e)}")

    # 3. Procesamiento línea por línea
    detalles = []
    conteo = {"VALIDA": 0, "FUERA_DICCIONARIO": 0, "ERROR_FORMATO": 0}

    for idx, linea in enumerate(lineas, 1):
        match = patron_compilado.fullmatch(linea.strip())

        if not match:
            detalles.append({
                "numero_linea": idx,
                "linea_original": linea,
                "estado": "ERROR_FORMATO",
                "es_valida": False,
                "diagnostico": "La línea no cumple la estructura sintáctica de la expresión regular.",
                "componentes": {}
            })
            conteo["ERROR_FORMATO"] += 1
            continue

        componentes = match.groupdict()
        token_evaluar = componentes.get(campo_clave)
        
        if not token_evaluar and componentes:
            token_evaluar = next(iter(componentes.values()))

        if token_evaluar and token_evaluar.upper() not in diccionario:
            detalles.append({
                "numero_linea": idx,
                "linea_original": linea,
                "estado": "FUERA_DICCIONARIO",
                "es_valida": False,
                "diagnostico": f"Estructura correcta, pero el token '{token_evaluar}' no pertenece al diccionario: {diccionario}.",
                "componentes": componentes
            })
            conteo["FUERA_DICCIONARIO"] += 1
        else:
            detalles.append({
                "numero_linea": idx,
                "linea_original": linea,
                "estado": "VALIDA",
                "es_valida": True,
                "diagnostico": "Línea conforme a la expresión regular y con tokens válidos.",
                "componentes": componentes
            })
            conteo["VALIDA"] += 1

    return {
        "total_lineas": len(detalles),
        "lineas_validas": conteo["VALIDA"],
        "lineas_fuera_diccionario": conteo["FUERA_DICCIONARIO"],
        "lineas_error_formato": conteo["ERROR_FORMATO"],
        "regex_utilizada": regex_usar,
        "diccionario_utilizado": diccionario,
        "detalles": detalles,
        "mensaje": f"Análisis finalizado: {conteo['VALIDA']} válidas de {len(detalles)} líneas."
    }