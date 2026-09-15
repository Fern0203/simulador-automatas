// Variables para almacenar las instancias activas de los grafos
let red_grafo_crear = null;
let red_grafo_conversion = null;
let red_grafo_minimizar = null;

// Opciones visuales base para Vis-Network
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

// Funcion principal para dibujar un automata en un lienzo especifico
function dibujar_grafo_automata(id_contenedor, datos_automata) {
    const contenedor = document.getElementById(id_contenedor);
    if (!contenedor || !datos_automata) return null;

    const nodos = [];
    const aristas = [];

    // 1. Crear los nodos (estados)
    datos_automata.estados.forEach((estado) => {
        const es_inicial = (estado === datos_automata.estado_inicial);
        const es_final = datos_automata.estados_finales.includes(estado);

        let color_nodo = "#1e293b";
        let borde_nodo = "#3b82f6";
        let ancho_borde = 2;

        // Si es final, destacamos con doble borde simulado o color verde
        if (es_final) {
            borde_nodo = "#22c55e";
            ancho_borde = 4;
        }

        // Si es inicial, añadimos un indicador visual
        let etiqueta_nodo = estado;
        if (es_inicial) {
            etiqueta_nodo = `→ ${estado}`;
        }

        nodos.push({
            id: estado,
            label: etiqueta_nodo,
            borderWidth: ancho_borde,
            color: {
                background: color_nodo,
                border: borde_nodo
            }
        });
    });

    // 2. Agrupar transiciones entre los mismos nodos (ej. '0, 1')
    const mapa_transiciones = {};

    datos_automata.transiciones.forEach((transicion) => {
        const origen = transicion.de;
        const simbolo = transicion.simbolo;
        const destinos = Array.isArray(transicion.a) ? transicion.a : [transicion.a];

        destinos.forEach((destino) => {
            const clave = `${origen}->${destino}`;
            if (!mapa_transiciones[clave]) {
                mapa_transiciones[clave] = {
                    de: origen,
                    a: destino,
                    simbolos: []
                };
            }
            if (!mapa_transiciones[clave].simbolos.includes(simbolo)) {
                mapa_transiciones[clave].simbolos.push(simbolo);
            }
        });
    });

    // 3. Crear las aristas con sus simbolos combinados
    Object.values(mapa_transiciones).forEach((t) => {
        aristas.push({
            from: t.de,
            to: t.a,
            label: t.simbolos.join(", ")
        });
    });

    // 4. Instanciar la red en Vis-Network
    const datos_red = {
        nodes: new vis.DataSet(nodos),
        edges: new vis.DataSet(aristas)
    };

    return new vis.Network(contenedor, datos_red, opciones_visuales_grafo);
}