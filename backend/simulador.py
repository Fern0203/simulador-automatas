
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