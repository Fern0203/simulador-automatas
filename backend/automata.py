# clase principal del automata, que guarda los datos y tiene funciones para validar y convertir a diccionario

class Automata:
    
    
    # Constructor de la clase Automata, con el fin de inicializar los atributos del automata y guardar las transiciones en un diccionario para facilitar su búsqueda y validación.
    def __init__(self, tipo_automata, estados, alfabeto, estado_inicial, estados_finales, transiciones):
        
       
        self.tipo_automata = tipo_automata.upper() 
        self.estados = set(estados)
        self.alfabeto = set(alfabeto)
        
        self.estado_inicial = estado_inicial
        self.estados_finales = set(estados_finales)
        
        
        self.tabla_transiciones = {}
        self.guardar_transiciones(transiciones)

    
    #guardamos las transicciones en un diccionario, para que sea mas facil de buscar y validar
    def guardar_transiciones(self, lista_transiciones):
        
        # Recorremos la lista que viene del formulario o JSON
        for t in lista_transiciones:
            origen = t["de"]
            simbolo = t["simbolo"]
            destinos = t["a"]
            
            # Si el destino es un solo estado, lo convertimos a lista para poder iterar sobre el
            if type(destinos) != list:
                destinos = [destinos]

            clave = (origen, simbolo)
            
            # Si no existe la clave todavia, creamos un set vacio
            if clave not in self.tabla_transiciones:
                self.tabla_transiciones[clave] = set()
                
            # Agregamos los estados destino
            for d in destinos:
                self.tabla_transiciones[clave].add(d)

    # Funcion para obtener los destinos de un estado y simbolo
    def obtener_destinos(self, origen, simbolo):
        # Busca a donde ir. Si no hay camino, regresa un set vacio
        clave = (origen, simbolo)
        
        # Si la clave existe, regresamos los destinos
        if clave in self.tabla_transiciones:
            return self.tabla_transiciones[clave]
        return set()

    # Funcion para validar la estructura del automata, revisando que no falten datos importantes y que los estados y simbolos existan
    def validar_estructura(self):
        # Revisamos que no falten datos importantes
        errores = []

        #revisamos que haya al menos un estado y que el alfabeto no este vacio
        if len(self.estados) == 0:
            errores.append("Debes ingresar al menos un estado.")

        #revisamos que el alfabeto no este vacio
        if len(self.alfabeto) == 0:
            errores.append("El alfabeto no puede estar vacio.")

        #revisamos que el estado inicial este en la lista de estados
        if self.estado_inicial not in self.estados:
            errores.append(f"El estado inicial '{self.estado_inicial}' no esta en la lista de estados.")

        #revisamos que los estados finales esten en la lista de estados
        for final in self.estados_finales:
            if final not in self.estados:
                errores.append(f"El estado final '{final}' no existe en los estados creados.")

        # Los simbolos que aceptamos como salto vacio
        simbolos_epsilon = ["ε", "E", "lambda", ""]
        alfabeto_permitido = list(self.alfabeto) + simbolos_epsilon

        # Validar cada transicion guardada
        for (origen, simbolo), destinos in self.tabla_transiciones.items():
            if origen not in self.estados:
                errores.append(f"El estado origen '{origen}' no existe.")
            if simbolo not in alfabeto_permitido:
                errores.append(f"El simbolo '{simbolo}' no esta en el alfabeto.")
            for d in destinos:
                if d not in self.estados:
                    errores.append(f"El estado destino '{d}' no existe.")

        es_valido = (len(errores) == 0)
        return es_valido, errores

    # Funcion para revisar si el automata es AFN, revisando si tiene saltos epsilon o si un simbolo va a varios lugares
    def es_afn(self):
        # Revisa si tiene saltos epsilon o si un simbolo va a varios lugares
        simbolos_epsilon = ["ε", "E", "lambda", ""]

        for (origen, simbolo), destinos in self.tabla_transiciones.items():
            # Si usa epsilon y tiene destinos, es AFN
            if simbolo in simbolos_epsilon and len(destinos) > 0:
                return True
            # Si un simbolo tiene 2 o mas caminos posibles, es AFN
            if len(destinos) > 1:
                return True

        return False

    # Funcion para convertir el automata a un diccionario, para poder mandarlo a la web y que sea facil de leer
    def a_diccionario(self):
        # Convierte el automata a un formato facil de mandar a la web
        lista_transiciones = []
        for (origen, simbolo), destinos in self.tabla_transiciones.items():
            lista_transiciones.append({
                "de": origen,
                "simbolo": simbolo,
                "a": sorted(list(destinos))
            })

        return {
            "tipo": self.tipo_automata,
            "estados": sorted(list(self.estados)),
            "alfabeto": sorted(list(self.alfabeto)),
            "estado_inicial": self.estado_inicial,
            "estados_finales": sorted(list(self.estados_finales)),
            "transiciones": lista_transiciones
        }