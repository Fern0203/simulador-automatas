// Variables globales para almacenar las redes de Vis-Network y sus datasets
let red_grafo_crear = null;
let dataset_nodos_crear = null;
let dataset_aristas_crear = null;

let red_grafo_conversion = null;
let red_grafo_minimizar = null;

// Configuración visual de Vis-Network (corregida sin 'bold: true')
const opciones_visuales_grafo = {
    nodes: {
        shape: "circle",
        size: 26,
        font: {
            color: "#ffffff",
            size: 14,
            face: "Arial"
        },
        color: {
            background: "#1e293b",
            border: "#3b82f6",
            highlight: {
                background: "#2563eb",
                border: "#60a5fa"
            }
        },
        borderWidth: 2
    },
    edges: {
        arrows: {
            to: {
                enabled: true,
                scaleFactor: 0.8
            }
        },
        color: {
            color: "#94a3b8",
            highlight: "#38bdf8"
        },
        font: {
            color: "#f8fafc",
            size: 12,
            background: "#0f172a",
            strokeWidth: 0,
            align: "top"
        },
        smooth: {
            type: "curvedCW",
            roundness: 0.2
        }
    },
    physics: {
        enabled: true,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
            gravitationalConstant: -50,
            centralGravity: 0.01,
            springLength: 100,
            springConstant: 0.08
        }
    }
};

// fucion principal para dibujar un grafo a partir de un objeto de autómata
function dibujar_grafo_automata(id_contenedor, datos_recibidos) {
    const contenedor = document.getElementById(id_contenedor);
    if (!contenedor || !datos_recibidos) return null;

    // 1. Desempaquetar si el autómata viene anidado en una propiedad
    let aut = datos_recibidos;
    const posibles_claves = [
        "automata", "afd", "automata_afd", "automata_convertido", 
        "automata_minimizado", "nuevo_automata", "afd_convertido", 
        "afd_resultado", "resultado", "data"
    ];

    for (const clave of posibles_claves) {
        if (datos_recibidos[clave] && typeof datos_recibidos[clave] === "object") {
            aut = datos_recibidos[clave];
            break;
        }
    }

    // 2. Extraer y normalizar los estados (soporta listas, sets u objetos con claves)
    let lista_estados_cruda = aut.estados || aut.states || aut.Q || aut.nodos || [];
    let estados_normalizados = [];

    if (Array.isArray(lista_estados_cruda)) {
        estados_normalizados = lista_estados_cruda.map(e => Array.isArray(e) ? e.join("") : String(e));
    } else if (typeof lista_estados_cruda === "object" && lista_estados_cruda !== null) {
        estados_normalizados = Object.keys(lista_estados_cruda);
    }

    if (estados_normalizados.length === 0) {
        console.error("El autómata a dibujar no contiene una lista válida de estados:", aut);
        return null;
    }

    // 3. Normalizar estado inicial y estados de aceptación
    let inicial_crudo = aut.estado_inicial ?? aut.inicial ?? aut.q0 ?? aut.initial_state ?? "";
    const estado_inicial = Array.isArray(inicial_crudo) ? inicial_crudo.join("") : String(inicial_crudo);

    let finales_crudos = aut.estados_finales ?? aut.finales ?? aut.F ?? aut.accept_states ?? [];
    if (!Array.isArray(finales_crudos)) {
        finales_crudos = (typeof finales_crudos === "object" && finales_crudos !== null)
            ? Object.keys(finales_crudos) 
            : [finales_crudos];
    }
    const estados_finales = finales_crudos.map(f => Array.isArray(f) ? f.join("") : String(f));

    // 4. Normalizar transiciones (soporta lista de objetos o diccionario anidado)
    let lista_transiciones = [];
    const transiciones_crudas = aut.transiciones || aut.transitions || aut.delta || [];

    if (Array.isArray(transiciones_crudas)) {
        lista_transiciones = transiciones_crudas;
    } else if (typeof transiciones_crudas === "object" && transiciones_crudas !== null) {
        // Convierte diccionarios tipo { q0: { a: ["q1"], b: ["q0"] } } al formato estándar
        for (const [origen, mapeo_simbolos] of Object.entries(transiciones_crudas)) {
            if (typeof mapeo_simbolos === "object" && mapeo_simbolos !== null) {
                for (const [simbolo, dest] of Object.entries(mapeo_simbolos)) {
                    lista_transiciones.push({
                        de: origen,
                        simbolo: simbolo,
                        a: Array.isArray(dest) ? dest : [dest]
                    });
                }
            }
        }
    }

    const lista_nodos = [];
    const lista_aristas = [];

    // Construcción de nodos para Vis-Network
    estados_normalizados.forEach((estado) => {
        const es_inicial = (estado === estado_inicial);
        const es_final = estados_finales.includes(estado);

        let borde_color = es_final ? "#22c55e" : "#3b82f6";
        let borde_ancho = es_final ? 4 : 2;
        let etiqueta = es_inicial ? `→ ${estado}` : estado;

        lista_nodos.push({
            id: estado,
            label: etiqueta,
            borderWidth: borde_ancho,
            es_final: es_final,
            es_inicial: es_inicial,
            color: {
                background: "#1e293b",
                border: borde_color
            }
        });
    });

    // 5. Agrupar aristas con mismo origen y destino
    const mapa_aristas = {};
    lista_transiciones.forEach((t) => {
        const origen_crudo = t.de ?? t.origen ?? t.from ?? "";
        const origen = Array.isArray(origen_crudo) ? origen_crudo.join("") : String(origen_crudo);

        const simbolo = String(t.simbolo ?? t.symbol ?? "");
        const destinos_crudos = t.a ?? t.hacia ?? t.to ?? t.destino ?? [];
        const destinos = Array.isArray(destinos_crudos) ? destinos_crudos : [destinos_crudos];

        destinos.forEach((d) => {
            if (d !== undefined && d !== null && d !== "") {
                const destino = Array.isArray(d) ? d.join("") : String(d);
                const clave = `${origen}->${destino}`;

                if (!mapa_aristas[clave]) {
                    mapa_aristas[clave] = { de: origen, a: destino, simbolos: [] };
                }
                if (!mapa_aristas[clave].simbolos.includes(simbolo)) {
                    mapa_aristas[clave].simbolos.push(simbolo);
                }
            }
        });
    });

    Object.values(mapa_aristas).forEach((t) => {
        lista_aristas.push({
            from: t.de,
            to: t.a,
            label: t.simbolos.join(", ")
        });
    });

    const dataset_nodos = new vis.DataSet(lista_nodos);
    const dataset_aristas = new vis.DataSet(lista_aristas);

    if (id_contenedor === "lienzo_grafo_crear") {
        dataset_nodos_crear = dataset_nodos;
        dataset_aristas_crear = dataset_aristas;
    }

    return new vis.Network(contenedor, { nodes: dataset_nodos, edges: dataset_aristas }, opciones_visuales_grafo);
}

// Pausa en milisegundos para la animación
function esperar_tiempo(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Restaura los colores base de un nodo según su tipo
function restaurar_color_nodo(id_nodo) {
    if (!dataset_nodos_crear) return;
    const nodo = dataset_nodos_crear.get(id_nodo);
    if (!nodo) return;

    dataset_nodos_crear.update({
        id: id_nodo,
        color: {
            background: "#1e293b",
            border: nodo.es_final ? "#22c55e" : "#3b82f6"
        }
    });
}

// animación paso a paso de un recorrido en el grafo
window.animar_recorrido_grafo = async function(pasos, fue_aceptada) {
    if (!dataset_nodos_crear || !pasos || pasos.length === 0) {
        console.warn("Dataset no disponible o lista de pasos vacía.");
        return;
    }

    // 1. Restaurar todos los nodos a su apariencia inicial
    const todos_los_nodos = dataset_nodos_crear.getIds();
    todos_los_nodos.forEach((id) => restaurar_color_nodo(id));
    if (red_grafo_crear) red_grafo_crear.redraw();

    // 2. Recorrer cada transición paso a paso
    for (let i = 0; i < pasos.length; i++) {
        const paso = pasos[i];

        // Normalizar 'desde' y 'hacia'
        const origen = Array.isArray(paso.desde) ? paso.desde : (paso.desde ? [paso.desde] : []);
        const destino = Array.isArray(paso.hacia) ? paso.hacia : (paso.hacia ? [paso.hacia] : []);

        const es_ultimo_paso = (i === pasos.length - 1);

        // A. Resaltar estado(s) de origen en amarillo
        origen.forEach((id) => {
            if (dataset_nodos_crear.get(id)) {
                dataset_nodos_crear.update({
                    id: id,
                    color: { background: "#854d0e", border: "#facc15" }
                });
            }
        });
        if (red_grafo_crear) red_grafo_crear.redraw();

        await esperar_tiempo(500);

        // B. Si no es el último paso, transicionar hacia el destino y restaurar origen
        if (!es_ultimo_paso) {
            origen.forEach((id) => restaurar_color_nodo(id));

            destino.forEach((id) => {
                if (dataset_nodos_crear.get(id)) {
                    dataset_nodos_crear.update({
                        id: id,
                        color: { background: "#854d0e", border: "#facc15" }
                    });
                }
            });
            if (red_grafo_crear) red_grafo_crear.redraw();

            await esperar_tiempo(600);

            destino.forEach((id) => restaurar_color_nodo(id));
        } else {
            // C. Último paso: apagar origen y pintar el estado final alcanzado
            origen.forEach((id) => restaurar_color_nodo(id));

            const fondo = fue_aceptada ? "#14532d" : "#7f1d1d";
            const borde = fue_aceptada ? "#22c55e" : "#ef4444";

            destino.forEach((id) => {
                if (dataset_nodos_crear.get(id)) {
                    dataset_nodos_crear.update({
                        id: id,
                        color: { background: fondo, border: borde }
                    });
                }
            });
            if (red_grafo_crear) red_grafo_crear.redraw();
        }
    }
};