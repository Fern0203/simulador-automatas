from automata import Automata


#funcion para eliminar los estados inalcanzables de un automata
def eliminar_estados_inalcanzables(automata):
    # Busqueda para ver que estados se tocan desde el inicial
    alcanzables = set([automata.estado_inicial])
    cola = [automata.estado_inicial]

    while len(cola) > 0:
        actual = cola.pop(0)
        for simbolo in automata.alfabeto:
            destinos = automata.obtener_destinos(actual, simbolo)
            for d in destinos:
                if d not in alcanzables:
                    alcanzables.add(d)
                    cola.append(d)

    # Filtramos estados y finales que si sean alcanzables
    estados_limpios = [e for e in automata.estados if e in alcanzables]
    finales_limpios = [e for e in automata.estados_finales if e in alcanzables]

    # Filtramos las transiciones
    transiciones_limpias = []
    for (origen, simbolo), destinos in automata.tabla_transiciones.items():
        if origen in alcanzables:
            destinos_validos = [d for d in destinos if d in alcanzables]
            if len(destinos_validos) > 0:
                transiciones_limpias.append({
                    "de": origen,
                    "simbolo": simbolo,
                    "a": destinos_validos
                })

    return Automata(
        tipo_automata="AFD",
        estados=estados_limpios,
        alfabeto=sorted(list(automata.alfabeto)),
        estado_inicial=automata.estado_inicial,
        estados_finales=finales_limpios,
        transiciones=transiciones_limpias
    )

# funcion para minimizar un AFD
def minimizar_afd(automata_afd):
    # vamos a verificar que el automata sea un AFD, si es un AFN no se puede minimizar
    if automata_afd.es_afn():
        return None, "El automata tiene caracteristicas de AFN. Conviertalo a AFD antes de minimizar."

    # aqui se eliminan los estados inalcanzables del AFD antes de iniciar la minimizacion
    automata = eliminar_estados_inalcanzables(automata_afd)
    alfabeto = sorted(list(automata.alfabeto))

    # luego separamos los estados en dos grupos: finales y no finales
    no_finales = set(automata.estados) - set(automata.estados_finales)
    finales = set(automata.estados_finales)


    # este bloque de codigo es para guardar los pasos de la minimizacion, para que el usuario pueda verlos en la interfaz
    particiones = []
    if len(no_finales) > 0:
        particiones.append(no_finales)
    if len(finales) > 0:
        particiones.append(finales)

    pasos_particiones = [{
        "iteracion": 0,
        "particiones": [sorted(list(p)) for p in particiones]
    }]

    # luego se itera hasta que no haya cambios en las particiones, es decir, hasta que no se puedan dividir mas los grupos de estados
    iteracion = 1
    cambio = True

    while cambio:
        cambio = False
        nuevas_particiones = []

        for grupo in particiones:
            if len(grupo) <= 1:
                nuevas_particiones.append(grupo)
                continue

            # Agrupamos estados que se comporten exactamente igual
            subgrupos = {}
            for estado in grupo:
                # Creamos una "firma" segun a que grupo va con cada simbolo
                firma = []
                for simbolo in alfabeto:
                    destinos = automata.obtener_destinos(estado, simbolo)
                    destino = list(destinos)[0] if len(destinos) > 0 else None

                    # Buscamos el indice del grupo destino en la particion actual
                    indice_grupo_destino = -1
                    for idx, grp in enumerate(particiones):
                        if destino in grp:
                            indice_grupo_destino = idx
                            break
                    firma.append((simbolo, indice_grupo_destino))

                firma_tupla = tuple(firma)
                if firma_tupla not in subgrupos:
                    subgrupos[firma_tupla] = set()
                subgrupos[firma_tupla].add(estado)

            # Si el grupo se dividio en mas de un subgrupo, hubo cambios
            if len(subgrupos) > 1:
                cambio = True

            for subgrp in subgrupos.values():
                nuevas_particiones.append(subgrp)

        particiones = nuevas_particiones
        pasos_particiones.append({
            "iteracion": iteracion,
            "particiones": [sorted(list(p)) for p in particiones]
        })
        iteracion += 1

    # cuando ya no hay cambios, se asignan nombres a los grupos de estados resultantes y se construye el AFD minimizado
    # y se identifican los estados finales y el estado inicial del AFD minimizado
    estado_a_nombre_min = {}
    nombres_nuevos = []
    nuevo_inicial = None
    nuevos_finales = set()

    for idx, grupo in enumerate(particiones):
        nombre_min = f"M{idx}"
        nombres_nuevos.append(nombre_min)

        for est in grupo:
            estado_a_nombre_min[est] = nombre_min
            if est == automata.estado_inicial:
                nuevo_inicial = nombre_min
            if est in automata.estados_finales:
                nuevos_finales.add(nombre_min)

    # construimos las transiciones del AFD minimizado, asegurandonos de no repetir trans
    nuevas_transiciones = []
    transiciones_vistas = set()

    for grupo in particiones:
        rep = list(grupo)[0] # Tomamos un estado representativo del grupo
        origen_min = estado_a_nombre_min[rep]

        for simbolo in alfabeto:
            destinos = automata.obtener_destinos(rep, simbolo)
            if len(destinos) > 0:
                dest_original = list(destinos)[0]
                destino_min = estado_a_nombre_min[dest_original]

                clave_t = (origen_min, simbolo, destino_min)
                if clave_t not in transiciones_vistas:
                    transiciones_vistas.add(clave_t)
                    nuevas_transiciones.append({
                        "de": origen_min,
                        "simbolo": simbolo,
                        "a": [destino_min]
                    })

    afd_minimizado = Automata(
        tipo_automata="AFD",
        estados=nombres_nuevos,
        alfabeto=alfabeto,
        estado_inicial=nuevo_inicial,
        estados_finales=sorted(list(nuevos_finales)),
        transiciones=nuevas_transiciones
    )

    return afd_minimizado, pasos_particiones