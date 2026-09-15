
# funcion para calcular la clausura epsilon de un conjunto de estados en un automata
def calcular_clausura_epsilon(estados_iniciales, automata):
    # Los simbolos que aceptamos como salto vacio
    simbolos_epsilon = ["ε", "E", "lambda", ""]
    
    # variables para guardar los estados alcanzables y los que faltan por revisar
    alcanzables = set(estados_iniciales)
    por_revisar = list(estados_iniciales)

    # aqui hacemos un recorrido en profundidad para encontrar todos los estados alcanzables por saltos epsilon
    while len(por_revisar) > 0:
        actual = por_revisar.pop()
        
        # Buscamos si tiene saltos epsilon
        for simbolo_eps in simbolos_epsilon:
            destinos = automata.obtener_destinos(actual, simbolo_eps)
            for d in destinos:
                if d not in alcanzables:
                    alcanzables.add(d)
                    por_revisar.append(d)

    return alcanzables


# esta fucion nos sirve para simular el AFD la cadena si acepta o no, tambien sus pasos
def simular_afd(automata, cadena):
    
    # Empezamos desde el estado inicial
    estado_actual = automata.estado_inicial
    pasos = []

    # Recorremos la palabra letra por letra
    for i in range(len(cadena)):
        simbolo = cadena[i]

        # Validamos si el simbolo es parte del alfabeto
        if simbolo not in automata.alfabeto:
            return {
                "aceptada": False,
                "mensaje": f"El simbolo '{simbolo}' no pertenece al alfabeto.",
                "pasos": pasos
            }

        destinos = automata.obtener_destinos(estado_actual, simbolo)

        # Si no hay camino definido con esa letra, la cadena muere aqui
        if len(destinos) == 0:
            pasos.append({
                "paso": i + 1,
                "simbolo": simbolo,
                "desde": [estado_actual],
                "hacia": []
            })
            return {
                "aceptada": False,
                "mensaje": f"Cadena rechazada: no hay transicion desde '{estado_actual}' con '{simbolo}'.",
                "pasos": pasos
            }

        # En un AFD solo hay un estado destino
        siguiente_estado = list(destinos)[0]
        
        pasos.append({
            "paso": i + 1,
            "simbolo": simbolo,
            "desde": [estado_actual],
            "hacia": [siguiente_estado]
        })

        estado_actual = siguiente_estado

    # Al terminar la palabra, vemos si quedamos en un estado final
    es_aceptada = estado_actual in automata.estados_finales
    if es_aceptada:
        mensaje = f"Cadena aceptada. Termino en el estado final '{estado_actual}'."
    else:
        mensaje = f"Cadena rechazada. El estado '{estado_actual}' no es de aceptacion."

    return {
        "aceptada": es_aceptada,
        "mensaje": mensaje,
        "pasos": pasos
    }

# esta fucion nos sirve para simular el AFN la cadena si acepta o no, tambien sus pasos
def simular_afn(automata, cadena):
    # En el AFN calculamos la clausura epsilon desde el inicio
    estados_actuales = calcular_clausura_epsilon({automata.estado_inicial}, automata)
    
    pasos = [{
        "paso": 0,
        "simbolo": "ε-clausura inicial",
        "desde": [automata.estado_inicial],
        "hacia": sorted(list(estados_actuales))
    }]

    # Recorremos la cadena simbolo por simbolo
    for i in range(len(cadena)):
        simbolo = cadena[i]

        if simbolo not in automata.alfabeto:
            return {
                "aceptada": False,
                "mensaje": f"El simbolo '{simbolo}' no pertenece al alfabeto.",
                "pasos": pasos
            }

        nuevos_destinos = set()

        # Nos movemos con el simbolo desde todos los estados que tenemos activos
        for est in estados_actuales:
            destinos = automata.obtener_destinos(est, simbolo)
            for d in destinos:
                nuevos_destinos.add(d)

        # A los destinos alcanzados les volvemos a aplicar clausura epsilon
        estados_siguientes = calcular_clausura_epsilon(nuevos_destinos, automata)

        pasos.append({
            "paso": i + 1,
            "simbolo": simbolo,
            "desde": sorted(list(estados_actuales)),
            "hacia": sorted(list(estados_siguientes))
        })

        # Si se vacian los caminos, se rechaza
        if len(estados_siguientes) == 0:
            return {
                "aceptada": False,
                "mensaje": f"Cadena rechazada: no hay caminos con el simbolo '{simbolo}'.",
                "pasos": pasos
            }

        estados_actuales = estados_siguientes

    # Si al menos uno de los estados activos es final, la cadena es valida
    finales_alcanzados = []
    for est in estados_actuales:
        if est in automata.estados_finales:
            finales_alcanzados.append(est)

    es_aceptada = (len(finales_alcanzados) > 0)
    if es_aceptada:
        mensaje = f"Cadena aceptada. Llego a estado(s) de aceptacion: {finales_alcanzados}."
    else:
        mensaje = f"Cadena rechazada. Ningun estado alcanzado {sorted(list(estados_actuales))} es final."

    return {
        "aceptada": es_aceptada,
        "mensaje": mensaje,
        "pasos": pasos
    }