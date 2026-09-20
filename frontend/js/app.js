// variables globales para almacenar el autómata y los pasos de conversión/minimización
let automata_guardado = null;
let tipo_automata_seleccionado = "AFN";

let pasos_conversion_guardados = [];
let pasos_minimizacion_guardados = [];
let afd_convertido_guardado = null;
let afd_minimizado_guardado = null;

// Localiza dinámicamente el autómata sin importar la clave devuelta por FastAPI
function desempaquetar_objeto_automata(data) {
    if (!data || typeof data !== "object") return null;

    // 1. Si el objeto ya contiene directamente los estados
    if (Array.isArray(data.estados) || Array.isArray(data.states) || Array.isArray(data.Q)) {
        return data;
    }

    // 2. Buscar en todas las claves comunes
    const claves_posibles = [
        "automata", "afd", "automata_convertido", "automata_afd", 
        "automata_minimizado", "nuevo_automata", "afd_convertido", 
        "afd_resultado", "resultado", "data"
    ];
    for (const clave of claves_posibles) {
        if (data[clave] && typeof data[clave] === "object") {
            const sub = data[clave];
            if (sub.estados || sub.states || sub.Q) {
                return sub;
            }
        }
    }

    // 3. Búsqueda profunda en cualquier propiedad que contenga estados
    for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === "object") {
            if (Array.isArray(v.estados) || Array.isArray(v.states) || Array.isArray(v.Q)) {
                return v;
            }
        }
    }

    return data;
}

// Localiza pasos o tablas de subconjuntos enviadas por el backend
function extraer_pasos_del_servidor(data) {
    if (!data || typeof data !== "object") return [];

    const claves_candidatas = [
        "pasos", "subconjuntos", "tabla_subconjuntos", "tabla", 
        "mapeo", "particiones", "iteraciones", "historial", 
        "proceso", "detalles", "pasos_particiones", "equivalencias", "grupos"
    ];

    for (const clave of claves_candidatas) {
        if (data[clave] !== undefined && data[clave] !== null) {
            return data[clave];
        }
    }

    // Descartar el automata y mensajes para extraer cualquier dato auxiliar
    const aut = desempaquetar_objeto_automata(data);
    for (const [k, v] of Object.entries(data)) {
        if (v !== aut && !["mensaje", "message", "tipo", "status"].includes(k)) {
            if (Array.isArray(v) && v.length > 0) return v;
            if (typeof v === "object" && v !== null && Object.keys(v).length > 0) return v;
        }
    }

    return [];
}

//funciones para limpiar y sincronizar listas de estados y transiciones
function limpiar_lista(texto) {
    if (!texto) return [];
    return texto.split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

function sincronizar_selectores_estados(input_estados, select_inicial, caja_finales) {
    const estados = limpiar_lista(input_estados.value);
    const valor_anterior = select_inicial.value;
    const marcados = Array.from(caja_finales.querySelectorAll("input:checked")).map((cb) => cb.value);

    // 1. Selector Estado Inicial
    select_inicial.innerHTML = "";
    if (estados.length === 0) {
        select_inicial.innerHTML = '<option value="">-- Ingresa primero los estados --</option>';
    } else {
        estados.forEach((e) => {
            const opt = document.createElement("option");
            opt.value = e;
            opt.textContent = e;
            if (e === valor_anterior) opt.selected = true;
            select_inicial.appendChild(opt);
        });
    }

    // 2. Checkboxes Estados Finales
    caja_finales.innerHTML = "";
    if (estados.length === 0) {
        caja_finales.innerHTML = '<span class="texto_ayuda_vacio">(Escribe los estados arriba)</span>';
    } else {
        estados.forEach((e) => {
            const label = document.createElement("label");
            label.style.display = "flex";
            label.style.alignItems = "center";
            label.style.gap = "4px";
            label.style.backgroundColor = "#1e293b";
            label.style.padding = "4px 8px";
            label.style.borderRadius = "4px";
            label.style.cursor = "pointer";
            label.innerHTML = `
                <input type="checkbox" value="${e}" ${marcados.includes(e) ? "checked" : ""}>
                <span>${e}</span>
            `;
            caja_finales.appendChild(label);
        });
    }
}

function renderizar_tabla_matriz(contenedor_tabla, estados, columnas, estado_inicial, estados_finales, sufijo_clase) {
    let html = "<thead><tr><th class='celda_estado_origen'>Estado</th>";
    columnas.forEach((c) => {
        html += `<th>${c}</th>`;
    });
    html += "</tr></thead><tbody>";

    estados.forEach((e) => {
        const es_ini = (e === estado_inicial);
        const es_fin = estados_finales.includes(e);
        let prefijo = (es_ini && es_fin) ? "→ * " : (es_ini ? "→ " : (es_fin ? "* " : ""));

        html += `<tr><td class="celda_estado_origen">${prefijo}${e}</td>`;
        columnas.forEach((c) => {
            html += `
                <td>
                    <input type="text" 
                           data-origen="${e}" 
                           data-simbolo="${c}" 
                           placeholder="${c === 'ε' ? 'ej. q1' : 'destinos'}" 
                           class="input_celda_transicion ${sufijo_clase}">
                </td>
            `;
        });
        html += "</tr>";
    });
    html += "</tbody>";
    contenedor_tabla.innerHTML = html;
}

function extraer_y_validar_transiciones(clase_inputs, estados_validos, es_afd) {
    const inputs = document.querySelectorAll(`.${clase_inputs}`);
    const transiciones = [];

    for (let inp of inputs) {
        const origen = inp.getAttribute("data-origen");
        const simbolo = inp.getAttribute("data-simbolo");
        const valor = inp.value.trim();

        if (valor.length > 0) {
            const destinos = limpiar_lista(valor);
            for (let d of destinos) {
                if (!estados_validos.includes(d)) {
                    alert(`El estado destino '${d}' en la transición (${origen}, ${simbolo}) no existe en Q.`);
                    inp.focus();
                    return null;
                }
            }
            if (es_afd && destinos.length > 1) {
                alert(`Violación AFD: El estado '${origen}' no puede tener múltiples destinos con '${simbolo}'.`);
                inp.focus();
                return null;
            }
            transiciones.push({
                de: origen,
                simbolo: simbolo,
                a: destinos
            });
        }
    }
    return transiciones;
}

// Adaptador de envio HTTP que soporta envio directo o reintento con clave 'automata'
async function enviar_automata_backend(url_endpoint, objeto_payload) {
    let respuesta = await fetch(url_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(objeto_payload)
    });

    // Si devuelve 422 Unprocessable Content, reintenta invirtiendo la estructura
    if (respuesta.status === 422) {
        const carga_alternativa = objeto_payload.automata 
            ? objeto_payload.automata 
            : { automata: objeto_payload };

        respuesta = await fetch(url_endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(carga_alternativa)
        });
    }

    if (!respuesta.ok) {
        const error_servidor = await respuesta.json();
        const mensaje = error_servidor.detail?.mensaje ||
                        (Array.isArray(error_servidor.detail) ? error_servidor.detail[0]?.msg : null) ||
                        error_servidor.message ||
                        "Error en el servidor al procesar el autómata.";
        throw new Error(mensaje);
    }

    return await respuesta.json();
}

// inicialización de eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {

    // 1. MENU LATERAL
    const boton_menu = document.getElementById("boton_abrir_menu");
    const boton_cerrar = document.getElementById("boton_cerrar_menu");
    const menu_lateral = document.getElementById("menu_lateral");
    const fondo_oscuro = document.getElementById("fondo_oscuro");

    function abrir_menu() {
        menu_lateral.classList.remove("menu_cerrado");
        menu_lateral.classList.add("menu_abierto");
        fondo_oscuro.classList.remove("ocultar");
    }

    function cerrar_menu() {
        menu_lateral.classList.remove("menu_abierto");
        menu_lateral.classList.add("menu_cerrado");
        fondo_oscuro.classList.add("ocultar");
    }

    if (boton_menu) boton_menu.addEventListener("click", abrir_menu);
    if (boton_cerrar) boton_cerrar.addEventListener("click", cerrar_menu);
    if (fondo_oscuro) fondo_oscuro.addEventListener("click", cerrar_menu);

    // 2. MODAL INTEGRANTES
    const modal_integrantes = document.getElementById("modal_integrantes");
    const boton_ver_integrantes_arriba = document.getElementById("boton_mostrar_integrantes");
    const tarjeta_ver_integrantes = document.getElementById("tarjeta_abrir_integrantes");
    const boton_cerrar_modal_x = document.getElementById("boton_cerrar_modal_integrantes");
    const boton_cerrar_modal_abajo = document.getElementById("boton_cerrar_modal_integrantes_pie");

    function mostrar_modal_integrantes() {
        modal_integrantes.classList.remove("ocultar");
    }

    function ocultar_modal_integrantes() {
        modal_integrantes.classList.add("ocultar");
    }

    if (boton_ver_integrantes_arriba) boton_ver_integrantes_arriba.addEventListener("click", mostrar_modal_integrantes);
    if (tarjeta_ver_integrantes) tarjeta_ver_integrantes.addEventListener("click", mostrar_modal_integrantes);
    if (boton_cerrar_modal_x) boton_cerrar_modal_x.addEventListener("click", ocultar_modal_integrantes);
    if (boton_cerrar_modal_abajo) boton_cerrar_modal_abajo.addEventListener("click", ocultar_modal_integrantes);

    // 3. MODAL PASOS ALGORÍTMICOS
    const modal_pasos = document.getElementById("modal_pasos");
    const titulo_modal_pasos = document.getElementById("titulo_modal_pasos");
    const contenedor_pasos = document.getElementById("contenedor_contenido_pasos");
    const boton_cerrar_pasos_x = document.getElementById("boton_cerrar_modal_pasos");
    const boton_cerrar_pasos_abajo = document.getElementById("boton_cerrar_modal_pasos_pie");

    function ocultar_modal_pasos() {
        modal_pasos.classList.add("ocultar");
    }

    if (boton_cerrar_pasos_x) boton_cerrar_pasos_x.addEventListener("click", ocultar_modal_pasos);
    if (boton_cerrar_pasos_abajo) boton_cerrar_pasos_abajo.addEventListener("click", ocultar_modal_pasos);

    window.mostrar_pasos_en_modal = function(titulo, lista_pasos_html) {
        if (titulo_modal_pasos) titulo_modal_pasos.textContent = titulo;
        if (contenedor_pasos) contenedor_pasos.innerHTML = lista_pasos_html;
        if (modal_pasos) modal_pasos.classList.remove("ocultar");
    };

    // 4. CAMBIO DE PANTALLAS (SPA)
    const botones_navegacion = document.querySelectorAll("[data-vista]");
    const todas_las_vistas = document.querySelectorAll(".seccion_vista");

    function mostrar_pantalla(nombre_vista) {
        todas_las_vistas.forEach((vista) => {
            vista.classList.add("ocultar");
        });

        const vista_destino = document.getElementById(nombre_vista);
        if (vista_destino) {
            vista_destino.classList.remove("ocultar");
        }

        cerrar_menu();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    botones_navegacion.forEach((boton) => {
        boton.addEventListener("click", () => {
            const vista_a_mostrar = boton.getAttribute("data-vista");
            if (vista_a_mostrar) {
                mostrar_pantalla(vista_a_mostrar);
            }
        });
    });

    /* Limpiar campos */
    function limpiarCampos() {
        const inputsTexto = document.querySelectorAll('.caja_texto_input, .campo_texto');
        inputsTexto.forEach(input => {
            input.value = '';
        });

        const selectores = document.querySelectorAll('select');
        selectores.forEach(select => {
            select.selectedIndex = 0;
            if (select.id.includes('selector')) {
                select.innerHTML = '<option value="">-- Ingresa primero los estados --</option>';
            }
        });

        const contenedoresCheckboxes = [
            document.getElementById('caja_estados_finales'),
            document.getElementById('caja_finales_convertir'),
            document.getElementById('caja_finales_minimizar')
        ];
        contenedoresCheckboxes.forEach(contenedor => {
            if (contenedor) {
                contenedor.innerHTML = '<span class="texto_ayuda_vacio">(Escribe los estados arriba)</span>';
            }
        });

        const tablas = ['tabla_matriz_transiciones', 'tabla_matriz_convertir', 'tabla_matriz_minimizar'];
        tablas.forEach(idTabla => {
            const tabla = document.getElementById(idTabla);
            if (tabla) tabla.innerHTML = '';
        });

        const seccionesOcultar = [
            'caja_seccion_matriz',
            'caja_resultado_crear',
            'caja_resultado_simulacion',
            'caja_matriz_convertir',
            'caja_resultado_conversion',
            'caja_matriz_minimizar',
            'caja_resultado_minimizar'
        ];
        seccionesOcultar.forEach(idSeccion => {
            const elem = document.getElementById(idSeccion);
            if (elem) elem.classList.add('ocultar');
        });

        const cajaResultadoSim = document.getElementById('caja_resultado_simulacion');
        if (cajaResultadoSim) cajaResultadoSim.innerHTML = '';
    }

    const botonesLimpiar = document.querySelectorAll('.limpiar-campos');
    botonesLimpiar.forEach(boton => {
        boton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir cualquier envío accidental si está dentro de un form
            limpiarCampos();
        });
    });

    /* Botón para regresar al inicio */
    const contenedorVista = [document.getElementById("vista_crear"), document.getElementById("vista_convertir"), document.getElementById("vista_minimizar")];
    const botonVolverInicio = `
        <div class="volver_inicio">
            <button class="boton_secundario boton_ir_inicio" data-vista="vista_inicio">
                ← Volver al Inicio
            </button>
        </div>
    `;
    contenedorVista.forEach((vistas) => {
        vistas.insertAdjacentHTML('afterbegin', botonVolverInicio);
    });
    
    const enlaceVolverInicio = document.querySelectorAll('.volver_inicio');
    enlaceVolverInicio.forEach((enlaceVolver) => {
        enlaceVolver.addEventListener("click", () => {
            const secciones = document.querySelectorAll('.seccion_vista');

            secciones.forEach(secciones => {
                secciones.classList.add('ocultar');
            });

            const vistaIncio = document.getElementById('vista_inicio');
            if(vistaIncio){
                vistaIncio.classList.remove('ocultar');
            }

            limpiarCampos();
        });
    });

    // 5. MÓDULO PRINCIPAL: CREACIÓN DE AUTÓMATAS
    const boton_afn = document.getElementById("boton_elegir_afn");
    const boton_afd = document.getElementById("boton_elegir_afd");
    const texto_descripcion_modo = document.getElementById("texto_descripcion_modo");
    const texto_ayuda_matriz = document.getElementById("texto_ayuda_matriz");
    const caja_seccion_matriz = document.getElementById("caja_seccion_matriz");
    const tabla_matriz = document.getElementById("tabla_matriz_transiciones");
    const campo_estados = document.getElementById("campo_estados");
    const campo_alfabeto = document.getElementById("campo_alfabeto");
    const selector_inicial = document.getElementById("selector_estado_inicial");
    const caja_finales = document.getElementById("caja_estados_finales");
    const boton_generar_tabla = document.getElementById("boton_generar_tabla");
    const boton_guardar_automata = document.getElementById("boton_guardar_automata");
    const caja_resultado_crear = document.getElementById("caja_resultado_crear");
    const insignia_estado_automata = document.getElementById("insignia_estado_automata");
    const campo_cadena = document.getElementById("campo_cadena_simular");
    const boton_simular = document.getElementById("boton_simular_cadena");
    const caja_resultado_simulacion = document.getElementById("caja_resultado_simulacion");

    if (boton_afn && boton_afd) {
        boton_afn.addEventListener("click", () => {
            tipo_automata_seleccionado = "AFN";
            boton_afn.className = "boton_tipo_activo";
            boton_afd.className = "boton_tipo_inactivo";
            if (texto_descripcion_modo) {
                texto_descripcion_modo.textContent = "Modo AFN: Permite transiciones vacías (ε) y múltiples estados destino separados por comas.";
            }
            if (texto_ayuda_matriz) {
                texto_ayuda_matriz.textContent = "En AFN separa destinos con comas (ej. q0, q1) o usa ε";
            }
            if (caja_seccion_matriz) caja_seccion_matriz.classList.add("ocultar");
            if (tabla_matriz) tabla_matriz.innerHTML = "";
        });

        boton_afd.addEventListener("click", () => {
            tipo_automata_seleccionado = "AFD";
            boton_afd.className = "boton_tipo_activo";
            boton_afn.className = "boton_tipo_inactivo";
            if (texto_descripcion_modo) {
                texto_descripcion_modo.textContent = "Modo AFD: Cada estado solo puede tener una única transición por símbolo (sin ε).";
            }
            if (texto_ayuda_matriz) {
                texto_ayuda_matriz.textContent = "En AFD solo se permite un único estado destino por casilla";
            }
            if (caja_seccion_matriz) caja_seccion_matriz.classList.add("ocultar");
            if (tabla_matriz) tabla_matriz.innerHTML = "";
        });
    }

    if (campo_estados && selector_inicial && caja_finales) {
        campo_estados.addEventListener("blur", () => {
            sincronizar_selectores_estados(campo_estados, selector_inicial, caja_finales);
        });
    }

    if (boton_generar_tabla) {
        boton_generar_tabla.addEventListener("click", () => {
            const estados = limpiar_lista(campo_estados.value);
            const alfabeto = limpiar_lista(campo_alfabeto.value);

            if (estados.length === 0 || alfabeto.length === 0) {
                alert("Por favor ingresa al menos un estado y un símbolo para el alfabeto.");
                return;
            }

            sincronizar_selectores_estados(campo_estados, selector_inicial, caja_finales);
            const estados_finales_marcados = Array.from(caja_finales.querySelectorAll("input:checked")).map((cb) => cb.value);

            const columnas = [...alfabeto];
            if (tipo_automata_seleccionado === "AFN") {
                columnas.push("ε");
            }

            renderizar_tabla_matriz(tabla_matriz, estados, columnas, selector_inicial.value, estados_finales_marcados, "celda_matriz_input");
            caja_seccion_matriz.classList.remove("ocultar");
        });
    }

    if (boton_guardar_automata) {
        boton_guardar_automata.addEventListener("click", () => {
            const estados = limpiar_lista(campo_estados.value);
            const alfabeto = limpiar_lista(campo_alfabeto.value);
            const estado_inicial = selector_inicial.value;
            const estados_finales = Array.from(caja_finales.querySelectorAll("input:checked")).map((cb) => cb.value);

            if (!estado_inicial) {
                alert("Por favor selecciona un estado inicial.");
                return;
            }

            const transiciones = extraer_y_validar_transiciones("celda_matriz_input", estados, tipo_automata_seleccionado === "AFD");
            if (!transiciones) return;

            automata_guardado = {
                tipo: tipo_automata_seleccionado,
                estados: estados,
                alfabeto: alfabeto,
                estado_inicial: estado_inicial,
                estados_finales: estados_finales,
                transiciones: transiciones
            };

            alert(`¡Autómata ${tipo_automata_seleccionado} generado con éxito!`);
            insignia_estado_automata.textContent = `${tipo_automata_seleccionado} Activo`;
            caja_resultado_crear.classList.remove("ocultar");
            caja_resultado_crear.scrollIntoView({ behavior: "smooth" });

            if (typeof dibujar_grafo_automata === "function") {
                red_grafo_crear = dibujar_grafo_automata("lienzo_grafo_crear", automata_guardado);
            }
        });
    }

    // SIMULACIÓN DE CADENAS
    if (boton_simular) {
        boton_simular.addEventListener("click", async () => {
            if (!automata_guardado) {
                alert("Primero debes crear y guardar un autómata.");
                return;
            }

            const cadena_ingresada = campo_cadena.value.trim();

            if (cadena_ingresada.length > 0) {
                const simbolos_cadena = cadena_ingresada.split("");
                for (let simbolo of simbolos_cadena) {
                    if (!automata_guardado.alfabeto.includes(simbolo)) {
                        alert(`Error: El símbolo '${simbolo}' no forma parte del alfabeto [${automata_guardado.alfabeto.join(", ")}].`);
                        campo_cadena.focus();
                        return;
                    }
                }
            }

            caja_resultado_simulacion.className = "caja_mensaje_resultado";
            caja_resultado_simulacion.style.backgroundColor = "#1e293b";
            caja_resultado_simulacion.style.color = "#93c5fd";
            caja_resultado_simulacion.textContent = "⏳ Enviando cadena al servidor...";
            caja_resultado_simulacion.classList.remove("ocultar");

            try {
                const resultado = await enviar_automata_backend("http://127.0.0.1:8000/api/simular", {
                    automata: automata_guardado,
                    cadena: cadena_ingresada
                });

                if (resultado.aceptada) {
                    caja_resultado_simulacion.className = "caja_mensaje_resultado resultado_aceptado";
                    caja_resultado_simulacion.innerHTML = `
                        <p>✅ <strong>Cadena Aceptada</strong></p>
                        <p style="font-size: 11px; margin-top: 4px;">${resultado.mensaje}</p>
                    `;
                } else {
                    caja_resultado_simulacion.className = "caja_mensaje_resultado resultado_rechazado";
                    caja_resultado_simulacion.innerHTML = `
                        <p>❌ <strong>Cadena Rechazada</strong></p>
                        <p style="font-size: 11px; margin-top: 4px;">${resultado.mensaje}</p>
                    `;
                }

                console.log("Respuesta completa del backend:", resultado);
                const lista_pasos = resultado.pasos || resultado.historial || resultado.camino || resultado.recorrido || [];

                if (window.animar_recorrido_grafo) {
                    window.animar_recorrido_grafo(lista_pasos, resultado.aceptada);
                }

            } catch (error) {
                caja_resultado_simulacion.className = "caja_mensaje_resultado resultado_rechazado";
                caja_resultado_simulacion.innerHTML = `
                    <p>⚠️ <strong>Error de Simulación</strong></p>
                    <p style="font-size: 11px; margin-top: 4px;">${error.message}</p>
                `;
            }
        });
    }

    //módulo de conversión AFN → AFD
    const campo_estados_conv = document.getElementById("campo_estados_convertir");
    const campo_alfabeto_conv = document.getElementById("campo_alfabeto_convertir");
    const selector_inicial_conv = document.getElementById("selector_inicial_convertir");
    const caja_finales_conv = document.getElementById("caja_finales_convertir");
    const boton_gen_tabla_conv = document.getElementById("boton_generar_tabla_convertir");
    const caja_matriz_conv = document.getElementById("caja_matriz_convertir");
    const tabla_matriz_conv = document.getElementById("tabla_matriz_convertir");
    const boton_ejecutar_conv = document.getElementById("boton_ejecutar_conversion");
    const caja_resultado_conv = document.getElementById("caja_resultado_conversion");
    const boton_pasos_conv = document.getElementById("boton_ver_pasos_conversion");

    if (campo_estados_conv && selector_inicial_conv && caja_finales_conv) {
        campo_estados_conv.addEventListener("blur", () => {
            sincronizar_selectores_estados(campo_estados_conv, selector_inicial_conv, caja_finales_conv);
        });
    }

    if (boton_gen_tabla_conv) {
        boton_gen_tabla_conv.addEventListener("click", () => {
            const estados = limpiar_lista(campo_estados_conv.value);
            const alfabeto = limpiar_lista(campo_alfabeto_conv.value);

            if (estados.length === 0 || alfabeto.length === 0) {
                alert("Ingresa al menos un estado y un símbolo del alfabeto.");
                return;
            }

            sincronizar_selectores_estados(campo_estados_conv, selector_inicial_conv, caja_finales_conv);
            const finales = Array.from(caja_finales_conv.querySelectorAll("input:checked")).map((cb) => cb.value);

            const columnas = [...alfabeto, "ε"];
            renderizar_tabla_matriz(tabla_matriz_conv, estados, columnas, selector_inicial_conv.value, finales, "celda_matriz_conv");
            caja_matriz_conv.classList.remove("ocultar");
        });
    }

    if (boton_ejecutar_conv) {
        boton_ejecutar_conv.addEventListener("click", async () => {
            const estados = limpiar_lista(campo_estados_conv.value);
            const alfabeto = limpiar_lista(campo_alfabeto_conv.value);
            const estado_inicial = selector_inicial_conv.value;
            const finales = Array.from(caja_finales_conv.querySelectorAll("input:checked")).map((cb) => cb.value);

            if (!estado_inicial) {
                alert("Selecciona un estado inicial.");
                return;
            }

            const transiciones = extraer_y_validar_transiciones("celda_matriz_conv", estados, false);
            if (!transiciones) return;

            const automata_afn = {
                tipo: "AFN",
                estados: estados,
                alfabeto: alfabeto,
                estado_inicial: estado_inicial,
                estados_finales: finales,
                transiciones: transiciones
            };

            boton_ejecutar_conv.disabled = true;
            boton_ejecutar_conv.textContent = "⏳ Convirtiendo a AFD...";

            try {
                const data = await enviar_automata_backend("http://127.0.0.1:8000/api/convertir", automata_afn);
                console.log("Claves recibidas en conversión:", Object.keys(data));
                console.log("Datos de conversión completos:", data);

                afd_convertido_guardado = data;
                pasos_conversion_guardados = extraer_pasos_del_servidor(data);

                caja_resultado_conv.classList.remove("ocultar");

                // Se extrae el automata directamente antes de dibujar
                const automata_dibujo = desempaquetar_objeto_automata(data);
                if (typeof dibujar_grafo_automata === "function") {
                    red_grafo_conversion = dibujar_grafo_automata("lienzo_grafo_conversion", automata_dibujo);
                }

                caja_resultado_conv.scrollIntoView({ behavior: "smooth" });

            } catch (error) {
                console.error("Error en conversión:", error);
                alert(`Error en conversión: ${error.message}`);
            } finally {
                boton_ejecutar_conv.disabled = false;
                boton_ejecutar_conv.textContent = "⚡ Convertir a AFD y Dibujar Grafo";
            }
        });
    }

   // 7. BOTÓN PARA VER PASOS DE CONVERSIÓN
    if (boton_pasos_conv) {
        boton_pasos_conv.addEventListener("click", () => {
            const aut = desempaquetar_objeto_automata(afd_convertido_guardado);
            const pasos = Array.isArray(pasos_conversion_guardados) ? pasos_conversion_guardados : [];
            const tiene_subconjuntos = pasos.length > 0 && pasos[0].subconjunto_afn;

            if (!tiene_subconjuntos && (!aut || !aut.estados)) {
                alert("No se encontraron los datos del AFD ni de los subconjuntos.");
                return;
            }

            // Alfabeto
            let alfabeto = (aut && aut.alfabeto) ? aut.alfabeto : [];
            if (alfabeto.length === 0 && tiene_subconjuntos && pasos[0].movimientos) {
                alfabeto = Object.keys(pasos[0].movimientos);
            }

            // Estados finales e inicial del AFD
            const estados_finales_afd = (aut && aut.estados_finales) ? aut.estados_finales : [];
            const estado_inicial_afd = (aut && aut.estado_inicial) ? aut.estado_inicial : (tiene_subconjuntos ? pasos[0].estado_afd : "");

            // 1. Encabezado institucional y fundamento teórico
            let html = `
                <div style="text-align: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 16px;">
                    <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin: 0; font-weight: 600;">
                        Universidad Mariano Gálvez de Guatemala · Ingeniería en Sistemas · Autómatas
                    </p>
                    <h3 style="font-size: 16px; font-weight: 700; color: #38bdf8; margin: 6px 0 0 0;">
                        Construcción de Subconjuntos (AFN → AFD)
                    </h3>
                </div>

                <div style="background-color: #0f172a; border: 1px solid #1e293b; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 12px 16px; margin-bottom: 18px;">
                    <h4 style="color: #60a5fa; font-size: 12px; text-transform: uppercase; margin: 0 0 6px 0; font-weight: 700;">Pasos del Algoritmo</h4>
                    <ul style="color: #cbd5e1; font-size: 12px; margin: 0; padding-left: 18px; line-height: 1.6;">
                        <li>El estado inicial del AFD es el subconjunto <code>{q₀}</code> (o la <code>ε-clausura(q₀)</code>).</li>
                        <li>Para cada subconjunto y cada símbolo del alfabeto (<code>Σ</code>), se calcula el conjunto de estados alcanzables: <code>ε-clausura(mover(T, a))</code>.</li>
                        <li>Un subconjunto es <strong>estado de aceptación</strong> si contiene al menos un estado final del AFN original.</li>
                    </ul>
                </div>

                <h4 style="color: #f8fafc; font-size: 13px; font-weight: 600; margin: 0 0 10px 0;">Tabla de Transición del AFD Resultante</h4>
                <div style="overflow-x: auto; border: 1px solid #334155; border-radius: 6px; margin-bottom: 16px;">
                    <table style="width: 100%; border-collapse: collapse; font-family: 'Courier New', monospace; font-size: 13px; text-align: center;">
                        <thead>
                            <tr style="background-color: #1e293b; color: #94a3b8; border-bottom: 2px solid #334155;">
                                <th style="padding: 10px 14px; border-right: 1px solid #334155; text-align: left;">Estado AFD</th>
            `;

            alfabeto.forEach(simb => {
                html += `<th style="padding: 10px 14px; border-right: 1px solid #334155;">${simb}</th>`;
            });

            html += `</tr></thead><tbody>`;

            const notas_aceptacion = [];

            // 2. Procesamiento con mapeo dinámico de subconjuntos
            if (tiene_subconjuntos) {
                const mapa_subconjuntos = {};
                pasos.forEach(p => {
                    mapa_subconjuntos[p.estado_afd] = "{" + (p.subconjunto_afn || []).join(", ") + "}";
                });

                pasos.forEach((p, idx) => {
                    const es_inicial = (p.estado_afd === estado_inicial_afd || idx === 0);
                    const es_final = estados_finales_afd.includes(p.estado_afd);
                    const fondo_fila = idx % 2 === 0 ? "#0f172a" : "#141e33";

                    let prefijo = "";
                    if (es_inicial && es_final) prefijo = "→ * ";
                    else if (es_inicial) prefijo = "→ ";
                    else if (es_final) prefijo = "* ";

                    const nombre_subconjunto = mapa_subconjuntos[p.estado_afd] || `{${p.estado_afd}}`;

                    if (es_final) {
                        const finales_incluidos = (p.subconjunto_afn || []).filter(e => 
                            (aut.estados_finales_afn || ["q2"]).includes(e)
                        );
                        const texto_finales = finales_incluidos.length > 0 ? finales_incluidos.join(", ") : "estado final";
                        notas_aceptacion.push(`<strong>${nombre_subconjunto}</strong> contiene <code>${texto_finales}</code> (final) → <em>Estado de aceptación</em>.`);
                    }

                    html += `
                        <tr style="background-color: ${fondo_fila}; border-bottom: 1px solid #1e293b;">
                            <td style="padding: 8px 14px; border-right: 1px solid #334155; text-align: left; font-weight: bold;">
                                <span style="color: ${es_final ? '#22c55e' : (es_inicial ? '#38bdf8' : '#94a3b8')};">${prefijo}</span>
                                <span style="color: #f8fafc;">${nombre_subconjunto}</span>
                            </td>
                    `;

                    alfabeto.forEach(simb => {
                        let celda_texto = "∅";
                        if (p.movimientos && p.movimientos[simb] !== undefined) {
                            const raw_mov = String(p.movimientos[simb]);
                            const match = raw_mov.match(/\[(.*?)\]/);
                            if (match) {
                                const elems = match[1].replace(/['"]/g, "").split(",").map(e => e.trim()).filter(Boolean);
                                celda_texto = elems.length > 0 ? "{" + elems.join(", ") + "}" : "∅";
                            } else {
                                const id_match = raw_mov.match(/(\w+)/);
                                const id_est = id_match ? id_match[1] : raw_mov;
                                celda_texto = mapa_subconjuntos[id_est] || id_est;
                            }
                        }
                        html += `<td style="padding: 8px 14px; border-right: 1px solid #334155; color: #cbd5e1;">${celda_texto}</td>`;
                    });

                    html += `</tr>`;
                });
            } else {
                (aut.estados || []).forEach((estado, idx) => {
                    const es_inicial = (estado === estado_inicial_afd);
                    const es_final = estados_finales_afd.includes(estado);
                    const fondo_fila = idx % 2 === 0 ? "#0f172a" : "#141e33";

                    let prefijo = (es_inicial && es_final) ? "→ * " : (es_inicial ? "→ " : (es_final ? "* " : ""));
                    const nombre_sub = estado.startsWith("{") ? estado : `{${estado}}`;

                    if (es_final) {
                        notas_aceptacion.push(`<strong>${nombre_sub}</strong> contiene estado terminal del AFN original → <em>Estado de aceptación</em>.`);
                    }

                    html += `
                        <tr style="background-color: ${fondo_fila}; border-bottom: 1px solid #1e293b;">
                            <td style="padding: 8px 14px; border-right: 1px solid #334155; text-align: left; font-weight: bold;">
                                <span style="color: ${es_final ? '#22c55e' : (es_inicial ? '#38bdf8' : '#94a3b8')};">${prefijo}</span>
                                <span style="color: #f8fafc;">${nombre_sub}</span>
                            </td>
                    `;

                    alfabeto.forEach(simb => {
                        const tr = (aut.transiciones || []).find(t => 
                            (t.de === estado || `{${t.de}}` === estado) && String(t.simbolo) === String(simb)
                        );
                        let destino_texto = "∅";
                        if (tr && tr.a) {
                            const arr = Array.isArray(tr.a) ? tr.a : [tr.a];
                            destino_texto = arr.map(d => d.startsWith("{") ? d : `{${d}}`).join(", ");
                        }
                        html += `<td style="padding: 8px 14px; border-right: 1px solid #334155; color: #cbd5e1;">${destino_texto}</td>`;
                    });

                    html += `</tr>`;
                });
            }

            html += `</tbody></table></div>`;

            // 3. Resumen de estados finales
            if (notas_aceptacion.length > 0) {
                html += `
                    <div style="background-color: #1e293b; border-left: 4px solid #22c55e; border-radius: 4px; padding: 12px 14px; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
                        <span style="color: #4ade80; font-weight: 700;">Estados de Aceptación (*):</span><br>
                        ${notas_aceptacion.join("<br>")}
                    </div>
                `;
            }

            window.mostrar_pasos_en_modal("Construcción de Subconjuntos", html);
        });
    }

    // modulo independiente: minimización de AFD
    const campo_estados_min = document.getElementById("campo_estados_minimizar");
    const campo_alfabeto_min = document.getElementById("campo_alfabeto_minimizar");
    const selector_inicial_min = document.getElementById("selector_inicial_minimizar");
    const caja_finales_min = document.getElementById("caja_finales_minimizar");
    const boton_gen_tabla_min = document.getElementById("boton_generar_tabla_minimizar");
    const caja_matriz_min = document.getElementById("caja_matriz_minimizar");
    const tabla_matriz_min = document.getElementById("tabla_matriz_minimizar");
    const boton_ejecutar_min = document.getElementById("boton_ejecutar_minimizar");
    const caja_resultado_min = document.getElementById("caja_resultado_minimizar");
    const boton_pasos_min = document.getElementById("boton_ver_pasos_minimizar");

    if (campo_estados_min && selector_inicial_min && caja_finales_min) {
        campo_estados_min.addEventListener("blur", () => {
            sincronizar_selectores_estados(campo_estados_min, selector_inicial_min, caja_finales_min);
        });
    }

    if (boton_gen_tabla_min) {
        boton_gen_tabla_min.addEventListener("click", () => {
            const estados = limpiar_lista(campo_estados_min.value);
            const alfabeto = limpiar_lista(campo_alfabeto_min.value);

            if (estados.length === 0 || alfabeto.length === 0) {
                alert("Ingresa al menos un estado y un símbolo del alfabeto.");
                return;
            }

            sincronizar_selectores_estados(campo_estados_min, selector_inicial_min, caja_finales_min);
            const finales = Array.from(caja_finales_min.querySelectorAll("input:checked")).map((cb) => cb.value);

            renderizar_tabla_matriz(tabla_matriz_min, estados, alfabeto, selector_inicial_min.value, finales, "celda_matriz_min");
            caja_matriz_min.classList.remove("ocultar");
        });
    }

    if (boton_ejecutar_min) {
        boton_ejecutar_min.addEventListener("click", async () => {
            const estados = limpiar_lista(campo_estados_min.value);
            const alfabeto = limpiar_lista(campo_alfabeto_min.value);
            const estado_inicial = selector_inicial_min.value;
            const finales = Array.from(caja_finales_min.querySelectorAll("input:checked")).map((cb) => cb.value);

            if (!estado_inicial) {
                alert("Selecciona un estado inicial.");
                return;
            }

            const transiciones = extraer_y_validar_transiciones("celda_matriz_min", estados, true);
            if (!transiciones) return;

            const automata_afd = {
                tipo: "AFD",
                estados: estados,
                alfabeto: alfabeto,
                estado_inicial: estado_inicial,
                estados_finales: finales,
                transiciones: transiciones
            };

            boton_ejecutar_min.disabled = true;
            boton_ejecutar_min.textContent = "⏳ Minimizando AFD...";

            try {
                const data = await enviar_automata_backend("http://127.0.0.1:8000/api/minimizar", automata_afd);
                console.log("Claves recibidas en minimización:", Object.keys(data));
                console.log("Datos de minimización completos:", data);

                afd_minimizado_guardado = data;
                pasos_minimizacion_guardados = extraer_pasos_del_servidor(data);

                caja_resultado_min.classList.remove("ocultar");

                // Se extrae el automata directamente antes de dibujar
                const automata_dibujo = desempaquetar_objeto_automata(data);
                if (typeof dibujar_grafo_automata === "function") {
                    red_grafo_minimizar = dibujar_grafo_automata("lienzo_grafo_minimizar", automata_dibujo);
                }

                caja_resultado_min.scrollIntoView({ behavior: "smooth" });

            } catch (error) {
                console.error("Error en minimización:", error);
                alert(`Error en minimización: ${error.message}`);
            } finally {
                boton_ejecutar_min.disabled = false;
                boton_ejecutar_min.textContent = "⚡ Minimizar AFD y Dibujar Grafo";
            }
        });
    }

    if (boton_pasos_min) {
        boton_pasos_min.addEventListener("click", () => {
            if (!pasos_minimizacion_guardados || pasos_minimizacion_guardados.length === 0) {
                alert("No hay registro de particiones disponible.");
                return;
            }

            // 1. Instrucciones teóricas y explicación del algoritmo
            let html = `
                <div style="background-color:#0f172a; border:1px solid #334155; border-radius:8px; padding:14px; margin-bottom:16px;">
                    <h4 style="color:#fbbf24; margin:0 0 6px 0; font-size:14px;">Algoritmo de Partición de Estados Equivalentes (Moore / Hopcroft)</h4>
                    <p style="color:#94a3b8; font-size:12px; margin:0 0 8px 0; line-height:1.5;">
                        Se agrupan los estados en clases de equivalencia de orden <em>k</em>. Los estados que permanecen en el mismo grupo tras la estabilización son <strong>equivalentes (indistinguibles)</strong> y se fusionan.
                    </p>
                    <ul style="color:#cbd5e1; font-size:11px; margin:0; padding-left:18px; line-height:1.6;">
                        <li><strong>P₀ (Base):</strong> Se divide el conjunto Q en estados No Finales (Q \\ F) y Finales (F).</li>
                        <li><strong>Pₖ₊₁ (Inducción):</strong> Se separan dos estados si con algún símbolo del alfabeto caen en grupos distintos en Pₖ.</li>
                        <li><strong>Criterio de Parada:</strong> Cuando Pₖ₊₁ = Pₖ, el proceso concluye y se obtiene el AFD mínimo.</li>
                    </ul>
                </div>

                <h4 style="color:#f8fafc; font-size:13px; margin:0 0 10px 0;">Evolución de las Particiones</h4>
                <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
            `;

            // 2. Renderizar cada iteración
            let equivalentes_encontrados = [];

            pasos_minimizacion_guardados.forEach((paso, idx) => {
                const iteracion_num = paso.iteracion !== undefined ? paso.iteracion : idx;
                const grupos = paso.particiones || (Array.isArray(paso) ? paso : []);
                const es_ultimo = (idx === pasos_minimizacion_guardados.length - 1);

                if (es_ultimo) {
                    equivalentes_encontrados = grupos.filter(g => Array.isArray(g) && g.length > 1);
                }

                html += `
                    <div style="background-color:#1e293b; border:1px solid ${es_ultimo ? '#22c55e' : '#334155'}; border-radius:6px; padding:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <strong style="color:${es_ultimo ? '#4ade80' : '#93c5fd'}; font-size:13px;">
                                Partición P<sub>${iteracion_num}</sub> ${es_ultimo ? '— (Estabilizada ✓)' : ''}
                            </strong>
                            <span style="font-size:11px; background-color:#0f172a; color:#94a3b8; padding:2px 8px; border-radius:4px;">
                                ${grupos.length} clase(s)
                            </span>
                        </div>
                        <div style="display:flex; flex-wrap:wrap; gap:8px;">
                `;

                grupos.forEach((grupo, g_idx) => {
                    const elementos = Array.isArray(grupo) ? grupo.join(", ") : grupo;
                    const es_fusion = Array.isArray(grupo) && grupo.length > 1;

                    html += `
                        <span style="background-color:#0f172a; border:1px solid ${es_fusion && es_ultimo ? '#22c55e' : '#475569'}; padding:6px 10px; border-radius:4px; font-family:monospace; font-size:12px; color:${es_fusion && es_ultimo ? '#86efac' : '#f8fafc'};">
                            { ${elementos} }
                        </span>
                    `;
                });

                html += `</div></div>`;
            });

            html += `</div>`;

            // 3. Conclusión de estados fusionados
            html += `
                <div style="background-color:#0f172a; border:1px solid #334155; border-left:4px solid #38bdf8; border-radius:4px; padding:12px; font-size:12px; color:#cbd5e1;">
                    <strong style="color:#38bdf8;">Resultado de la Fusión:</strong><br>
                    ${equivalentes_encontrados.length > 0 
                        ? `Los siguientes estados demostraron ser indistinguibles y se unificaron: <strong>${equivalentes_encontrados.map(g => `{${g.join(", ")}}`).join(" y ")}</strong>.` 
                        : "No se encontraron estados redundantes; el autómata ya se encontraba en su mínima expresión."}
                </div>
            `;

            window.mostrar_pasos_en_modal("Pasos de Minimización (Partición de Equivalencia)", html);
        });
    }

});