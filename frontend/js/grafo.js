// Referencias globales a las redes y datasets de cada lienzo
let red_grafo_crear = null;
let dataset_nodos_crear = null;
let dataset_aristas_crear = null;

let red_grafo_conversion = null;
let red_grafo_minimizar = null;

// Configuracion visual de Vis-Network
const opciones_visuales_grafo = {
    nodes: {
        shape: "circle",
        size: 26,
        font: {
            color: "#ffffff",
            size: 14,
            face: "Arial",
            bold: true
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

// Dibuja el grafo en el contenedor indicado y guarda los datasets
function dibujar_grafo_automata(id_contenedor, datos_automata) {
    const contenedor = document.getElementById(id_contenedor);
    if (!contenedor || !datos_automata) return null;

    const lista_nodos = [];
    const lista_aristas = [];

    // 1. Construir nodos
    datos_automata.estados.forEach((estado) => {
        const es_inicial = (estado === datos_automata.estado_inicial);
        const es_final = datos_automata.estados_finales.includes(estado);

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

    // 2. Agrupar transiciones con mismo origen y destino
    const mapa_aristas = {};
    datos_automata.transiciones.forEach((t) => {
        const destinos = Array.isArray(t.a) ? t.a : [t.a];
        destinos.forEach((destino) => {
            const clave = `${t.de}->${destino}`;
            if (!mapa_aristas[clave]) {
                mapa_aristas[clave] = { de: t.de, a: destino, simbolos: [] };
            }
            if (!mapa_aristas[clave].simbolos.includes(t.simbolo)) {
                mapa_aristas[clave].simbolos.push(t.simbolo);
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

    const red = new vis.Network(contenedor, { nodes: dataset_nodos, edges: dataset_aristas }, opciones_visuales_grafo);
    return red;
}

// Pausa en milisegundos para la animacion
function esperar_tiempo(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Restaura los colores base del nodo segun si es final o normal
function restaurar_color_nodo(id_nodo) {
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

// Recorre secuencialmente los pasos recibidos del backend

window.animar_recorrido_grafo = async function(pasos, fue_aceptada) {
    if (!dataset_nodos_crear || !pasos || pasos.length === 0) {
        console.warn("Dataset no disponible o lista de pasos vacía.");
        return;
    }

    // 1. Restaurar todos los nodos a su apariencia inicial
    const todos_los_nodos = dataset_nodos_crear.getIds();
    todos_los_nodos.forEach((id) => restaurar_color_nodo(id));
    if (red_grafo_crear) red_grafo_crear.redraw();

    // 2. Recorrer cada transicion paso a paso
    for (let i = 0; i < pasos.length; i++) {
        const paso = pasos[i];

        // Normalizar 'desde' y 'hacia' como arreglos
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

        // B. Si no es el ultimo paso, transicionar hacia el destino y restaurar origen
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
            // C. Ultimo paso: apagar origen y pintar el estado final alcanzado
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