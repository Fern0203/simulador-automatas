import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))



from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Any, Dict

# Importamos las clases y funciones hechas por el equipo de backend del proyecto
from automata import Automata
from simulador import simular_afd, simular_afn
from conversion import convertir_afn_a_afd
from minimizacion import minimizar_afd

# Creamos la app de FastAPI
app = FastAPI(title="Simulador de Autómatas UMG")

# Configuracion de CORS para que el frontend pueda conectarse sin problemas
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


#esta es la estructura de datos que se recibira o se espera del frontend para los automatas
class DatosAutomata(BaseModel):
    tipo: str
    estados: List[str]
    alfabeto: List[str]
    estado_inicial: str
    estados_finales: List[str]
    transiciones: List[Dict[str, Any]]

# clse para recibir la peticion de simulacion, que incluye el automata y la cadena a evaluar
class PeticionSimular(BaseModel):
    automata: DatosAutomata
    cadena: str = ""


# esta funcion se encarga de armar el automata a partir de los datos recibidos del frontend
def armar_automata(datos: DatosAutomata):
    # Crea el objeto con la logica base
    nuevo_automata = Automata(
        tipo_automata=datos.tipo,
        estados=datos.estados,
        alfabeto=datos.alfabeto,
        estado_inicial=datos.estado_inicial,
        estados_finales=datos.estados_finales,
        transiciones=datos.transiciones
    )
    
    # Valida que no vengan estados o simbolos inventados
    es_valido, errores = nuevo_automata.validar_estructura()
    if not es_valido:
        raise HTTPException(status_code=400, detail={"mensaje": "Datos invalidos", "errores": errores})
        
    return nuevo_automata


# apartado que nos ayudara a testear que el servidor este activo y funcionando correctamente

@app.get("/")
def inicio():
    return {"mensaje": "Servidor del Simulador de Automatas activo"}

# endpoints para las funcionalidades del simulador de automatas
@app.post("/api/simular")
def endpoint_simular(peticion: PeticionSimular):
    automata = armar_automata(peticion.automata)
    cadena = peticion.cadena.strip()

    # Si es AFN o tiene caracteristicas de AFN usamos su simulador
    if automata.tipo_automata == "AFN" or automata.es_afn():
        resultado = simular_afn(automata, cadena)
    else:
        resultado = simular_afd(automata, cadena)

    return resultado

# endpoints para convertir  automatas
@app.post("/api/convertir")
def endpoint_convertir(datos: DatosAutomata):
    automata = armar_automata(datos)

    # Validar que realmente sea un AFN
    if not automata.es_afn():
        raise HTTPException(
            status_code=400,
            detail={"mensaje": "El automata ya es determinista (AFD). Debe ingresar un AFN para convertir."}
        )

    afd_resultado, pasos = convertir_afn_a_afd(automata)
    
    if afd_resultado is None:
        raise HTTPException(status_code=400, detail={"mensaje": pasos})

    return {
        "mensaje": "Conversion exitosa",
        "automata_convertido": afd_resultado.a_diccionario(),
        "tabla_pasos": pasos
    }

# endpoints para minimizar automatas
@app.post("/api/minimizar")
def endpoint_minimizar(datos: DatosAutomata):
    automata = armar_automata(datos)

    # Validar que sea un AFD
    if automata.es_afn():
        raise HTTPException(
            status_code=400,
            detail={"mensaje": "El automata tiene caracteristicas de AFN. Conviertalo a AFD antes de minimizar."}
        )

    afd_min, pasos = minimizar_afd(automata)

    if afd_min is None:
        raise HTTPException(status_code=400, detail={"mensaje": pasos})

    return {
        "mensaje": "Minimizacion exitosa",
        "automata_minimizado": afd_min.a_diccionario(),
        "estados_originales": len(automata.estados),
        "estados_minimizados": len(afd_min.estados),
        "pasos_particiones": pasos
    }