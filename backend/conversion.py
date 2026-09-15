from automata import Automata
from simulador import calcular_clausura_epsilon




# funcion para minimizar un AFD
def convertir_afn_a_afd(automata_afn):
    
    # Validamos si es un AFN o no
    if not automata_afn.es_afn():
        return None, "El automata ya es determinista (AFD). No requiere conversion."

    alfabeto = sorted(list(automata_afn.alfabeto))

    # con esta funcion calculamos la clausura-epsilon del estado inicial y lo convertimos en un conjunto congelado (frozenset)
    conjunto_inicial = frozenset(calcular_clausura_epsilon({automata_afn.estado_inicial}, automata_afn))

    # Diccionarios para asignar nombres a los subconjuntos de estados y viceversa
    subconjuntos_a_nombre = {conjunto_inicial: "S0"}
    nombres_a_subconjunto = {"S0": sorted(list(conjunto_inicial))}

    por_procesar = [conjunto_inicial]
    contador_estados = 1

    nuevas_transiciones = []
    tabla_pasos = [] 

    # Exploramos cada subconjunto descubierto
    while len(por_procesar) > 0:
        actual_conjunto = por_procesar.pop(0)
        nombre_actual = subconjuntos_a_nombre[actual_conjunto]

        registro_paso = {
            "estado_afd": nombre_actual,
            "subconjunto_afn": sorted(list(actual_conjunto)),
            "movimientos": {}
        }

        # Para cada simbolo del alfabeto, encontramos los destinos directos y aplicamos clausura-epsilon
        for simbolo in alfabeto:
            destinos_directos = set()
            for estado in actual_conjunto:
                destinos = automata_afn.obtener_destinos(estado, simbolo)
                for d in destinos:
                    destinos_directos.add(d)

            # Aplicamos clausura-epsilon a todos los destinos alcanzados
            siguiente_conjunto = frozenset(calcular_clausura_epsilon(destinos_directos, automata_afn))

            if len(siguiente_conjunto) > 0:
                # Si encontramos un grupo nuevo de estados, le asignamos nombre
                if siguiente_conjunto not in subconjuntos_a_nombre:
                    nombre_nuevo = f"S{contador_estados}"
                    contador_estados += 1
                    subconjuntos_a_nombre[siguiente_conjunto] = nombre_nuevo
                    nombres_a_subconjunto[nombre_nuevo] = sorted(list(siguiente_conjunto))
                    por_procesar.append(siguiente_conjunto)

                destino_nombre = subconjuntos_a_nombre[siguiente_conjunto]
                nuevas_transiciones.append({
                    "de": nombre_actual,
                    "simbolo": simbolo,
                    "a": [destino_nombre]
                })

                registro_paso["movimientos"][simbolo] = f"{destino_nombre} {sorted(list(siguiente_conjunto))}"
            else:
                registro_paso["movimientos"][simbolo] = "∅ (Sin transicion)"

        tabla_pasos.append(registro_paso)

    # 3. Identificamos los estados finales del AFD resultante
    nuevos_estados = list(subconjuntos_a_nombre.values())
    nuevos_finales = []

    # Identificamos los estados finales del AFD resultante
    for conjunto, nombre in subconjuntos_a_nombre.items():
        for estado in conjunto:
            if estado in automata_afn.estados_finales:
                nuevos_finales.append(nombre)
                break

    # Por ultimo construimos el AFD resultante
    afd_resultado = Automata(
        tipo_automata="AFD",
        estados=nuevos_estados,
        alfabeto=alfabeto,
        estado_inicial="S0",
        estados_finales=nuevos_finales,
        transiciones=nuevas_transiciones
    )

    return afd_resultado, tabla_pasos