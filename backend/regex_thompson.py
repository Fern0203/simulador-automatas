

class Estado:
    """Representa un nodo en el AFN con transiciones directas y por epsilon."""
    _contador = 0

    def __init__(self, nombre=None):
        if nombre is None:
            self.nombre = f"q{Estado._contador}"
            Estado._contador += 1
        else:
            self.nombre = nombre
        # transiciones: {'simbolo': [Estado, Estado], 'ε': [Estado]}
        self.transiciones = {}

    def agregar_transicion(self, simbolo, destino):
        if simbolo not in self.transiciones:
            self.transiciones[simbolo] = []
        if destino not in self.transiciones[simbolo]:
            self.transiciones[simbolo].append(destino)

    @classmethod
    def reiniciar_contador(cls):
        cls._contador = 0


class FragmentoAFN:
    """Estructura intermedia para la construcción de Thompson."""
    def __init__(self, inicial: Estado, aceptacion: Estado):
        self.inicial = inicial
        self.aceptacion = aceptacion


# ==========================================
# 1. PARSER: INFIJO A POSTFIJO (SHUNTING-YARD)
# ==========================================

def insertar_concatenaciones_explicitas(regex: str) -> str:
    """Inserta el operador '.' donde existe concatenación implícita."""
    operadores_binarios = {'|', '.'}
    operadores_unarios = {'*', '+', '?'}
    resultado = []
    
    # Filtrar espacios
    exp = [c for c in regex if not c.isspace()]
    
    for i in range(len(exp)):
        c1 = exp[i]
        resultado.append(c1)
        
        if i + 1 < len(exp):
            c2 = exp[i + 1]
            # Condiciones donde debe existir concatenación (.)
            # 1. Símbolo seguido de símbolo o '('
            # 2. Operador unario (*, +, ?) seguido de símbolo o '('
            # 3. ')' seguido de símbolo o '('
            es_c1_fin = (c1 not in operadores_binarios and c1 != '(')
            es_c2_inicio = (c2 not in operadores_binarios and c2 not in operadores_unarios and c2 != ')')
            
            if es_c1_fin and es_c2_inicio:
                resultado.append('.')
                
    return "".join(resultado)


def regex_a_postfijo(regex: str) -> str:
    """Convierte expresión regular infija con '.' a postfija mediante Shunting-yard."""
    precedencia = {'*': 3, '+': 3, '?': 3, '.': 2, '|': 1}
    salida = []
    pila_operadores = []
    
    exp_con_puntos = insertar_concatenaciones_explicitas(regex)
    
    for caracter in exp_con_puntos:
        if caracter not in precedencia and caracter not in {'(', ')'}:
            # Es un símbolo del alfabeto
            salida.append(caracter)
        elif caracter == '(':
            pila_operadores.append(caracter)
        elif caracter == ')':
            while pila_operadores and pila_operadores[-1] != '(':
                salida.append(pila_operadores.pop())
            if not pila_operadores:
                raise ValueError("Paréntesis desbalanceados en la expresión regular.")
            pila_operadores.pop() # Quitar '('
        else:
            # Operador (*, +, ?, ., |)
            while (pila_operadores and pila_operadores[-1] != '(' and 
                   precedencia.get(pila_operadores[-1], 0) >= precedencia.get(caracter, 0)):
                salida.append(pila_operadores.pop())
            pila_operadores.append(caracter)
            
    while pila_operadores:
        op = pila_operadores.pop()
        if op in {'(', ')'}:
            raise ValueError("Paréntesis desbalanceados en la expresión regular.")
        salida.append(op)
        
    return "".join(salida)


# ==========================================
# 2. CONSTRUCCIÓN DE THOMPSON
# ==========================================

def construir_simbolo_base(simbolo: str) -> FragmentoAFN:
    """Crea: [q0] --simbolo--> [q1*]"""
    s0 = Estado()
    s1 = Estado()
    s0.agregar_transicion(simbolo, s1)
    return FragmentoAFN(s0, s1)


def construir_concatenacion(frag1: FragmentoAFN, frag2: FragmentoAFN) -> FragmentoAFN:
    """Conecta la aceptación de frag1 al inicio de frag2 mediante ε."""
    frag1.aceptacion.agregar_transicion('ε', frag2.inicial)
    return FragmentoAFN(frag1.inicial, frag2.aceptacion)


def construir_union(frag1: FragmentoAFN, frag2: FragmentoAFN) -> FragmentoAFN:
    """Crea nuevo inicio con saltos ε a ambos y conecta aceptaciones a nuevo final."""
    nuevo_inicio = Estado()
    nuevo_final = Estado()
    
    nuevo_inicio.agregar_transicion('ε', frag1.inicial)
    nuevo_inicio.agregar_transicion('ε', frag2.inicial)
    
    frag1.aceptacion.agregar_transicion('ε', nuevo_final)
    frag2.aceptacion.agregar_transicion('ε', nuevo_final)
    
    return FragmentoAFN(nuevo_inicio, nuevo_final)


def construir_cerradura_kleene(frag: FragmentoAFN) -> FragmentoAFN:
    """Crea nuevo inicio y final con salto ε directo (vacío) y ciclo de regreso."""
    nuevo_inicio = Estado()
    nuevo_final = Estado()
    
    nuevo_inicio.agregar_transicion('ε', frag.inicial)
    nuevo_inicio.agregar_transicion('ε', nuevo_final)
    
    frag.aceptacion.agregar_transicion('ε', frag.inicial)
    frag.aceptacion.agregar_transicion('ε', nuevo_final)
    
    return FragmentoAFN(nuevo_inicio, nuevo_final)


def construir_cerradura_positiva(frag: FragmentoAFN) -> FragmentoAFN:
    """Equivalente a r+: al menos una ocurrencia (ciclo de regreso sin salto inicial a fin)."""
    nuevo_inicio = Estado()
    nuevo_final = Estado()
    
    nuevo_inicio.agregar_transicion('ε', frag.inicial)
    frag.aceptacion.agregar_transicion('ε', frag.inicial)
    frag.aceptacion.agregar_transicion('ε', nuevo_final)
    
    return FragmentoAFN(nuevo_inicio, nuevo_final)


def construir_opcional(frag: FragmentoAFN) -> FragmentoAFN:
    """Equivalente a r?: 0 o 1 ocurrencia."""
    nuevo_inicio = Estado()
    nuevo_final = Estado()
    
    nuevo_inicio.agregar_transicion('ε', frag.inicial)
    nuevo_inicio.agregar_transicion('ε', nuevo_final)
    frag.aceptacion.agregar_transicion('ε', nuevo_final)
    
    return FragmentoAFN(nuevo_inicio, nuevo_final)


# ==========================================
# 3. ENSAMBLAJE Y EXPORTACIÓN COMPATIBLE
# ==========================================

def thompson_regex_a_afn(regex: str) -> dict:
    """
    Función principal que procesa la regex y retorna la 5-tupla en el 
    formato exacto que esperan 'app.js' y 'grafo.js'.
    """
    Estado.reiniciar_contador()
    postfijo = regex_a_postfijo(regex)
    pila = []
    alfabeto_set = set()
    
    for caracter in postfijo:
        if caracter == '*':
            if not pila:
                raise ValueError("Sintaxis inválida para operador '*'")
            pila.append(construir_cerradura_kleene(pila.pop()))
        elif caracter == '+':
            if not pila:
                raise ValueError("Sintaxis inválida para operador '+'")
            pila.append(construir_cerradura_positiva(pila.pop()))
        elif caracter == '?':
            if not pila:
                raise ValueError("Sintaxis inválida para operador '?'")
            pila.append(construir_opcional(pila.pop()))
        elif caracter == '.':
            if len(pila) < 2:
                raise ValueError("Sintaxis inválida para concatenación")
            f2 = pila.pop()
            f1 = pila.pop()
            pila.append(construir_concatenacion(f1, f2))
        elif caracter == '|':
            if len(pila) < 2:
                raise ValueError("Sintaxis inválida para unión '|'")
            f2 = pila.pop()
            f1 = pila.pop()
            pila.append(construir_union(f1, f2))
        else:
            # Símbolo formal
            alfabeto_set.add(caracter)
            pila.append(construir_simbolo_base(caracter))
            
    if len(pila) != 1:
        raise ValueError("Expresión regular malformada.")
        
    afn_final = pila.pop()
    
    # Recorrido BFS para recolectar todos los estados y formatear transiciones
    visitados = set()
    cola = [afn_final.inicial]
    estados_lista = []
    transiciones_dict = {}
    
    while cola:
        actual = cola.pop(0)
        if actual.nombre in visitados:
            continue
        visitados.add(actual.nombre)
        estados_lista.append(actual.nombre)
        
        transiciones_dict[actual.nombre] = {}
        for sim, destinos in actual.transiciones.items():
            transiciones_dict[actual.nombre][sim] = [d.nombre for d in destinos]
            for dest in destinos:
                if dest.nombre not in visitados:
                    cola.append(dest)
                    
    # Asegurar que el estado final tenga entrada en el diccionario
    if afn_final.aceptacion.nombre not in transiciones_dict:
        transiciones_dict[afn_final.aceptacion.nombre] = {}
        if afn_final.aceptacion.nombre not in estados_lista:
            estados_lista.append(afn_final.aceptacion.nombre)

    return {
        "estados": sorted(estados_lista, key=lambda x: int(x[1:]) if x[1:].isdigit() else x),
        "alfabeto": sorted(list(alfabeto_set)),
        "estado_inicial": afn_final.inicial.nombre,
        "estados_aceptacion": [afn_final.aceptacion.nombre],
        "transiciones": transiciones_dict,
        "mensaje": f"AFN generado correctamente con Thompson para la expresión: {regex}"
    }