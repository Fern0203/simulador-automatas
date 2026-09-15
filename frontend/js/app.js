// Variable para guardar el automata en memoria
let automata_guardado = null;
let tipo_automata_seleccionado = "AFN";

document.addEventListener("DOMContentLoaded", () => {

    // abrimos y cerramos el menu lateral
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

    boton_menu.addEventListener("click", abrir_menu);
    boton_cerrar.addEventListener("click", cerrar_menu);
    fondo_oscuro.addEventListener("click", cerrar_menu);

    // para abrir y cerrar el modal de integrantes
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

    boton_ver_integrantes_arriba.addEventListener("click", mostrar_modal_integrantes);
    if (tarjeta_ver_integrantes) {
        tarjeta_ver_integrantes.addEventListener("click", mostrar_modal_integrantes);
    }
    boton_cerrar_modal_x.addEventListener("click", ocultar_modal_integrantes);
    boton_cerrar_modal_abajo.addEventListener("click", ocultar_modal_integrantes);

    // para abrir y cerrar el modal de pasos algorítmicos
    const modal_pasos = document.getElementById("modal_pasos");
    const boton_cerrar_pasos_x = document.getElementById("boton_cerrar_modal_pasos");
    const boton_cerrar_pasos_abajo = document.getElementById("boton_cerrar_modal_pasos_pie");

    function ocultar_modal_pasos() {
        modal_pasos.classList.add("ocultar");
    }

    if (boton_cerrar_pasos_x) {
        boton_cerrar_pasos_x.addEventListener("click", ocultar_modal_pasos);
    }
    if (boton_cerrar_pasos_abajo) {
        boton_cerrar_pasos_abajo.addEventListener("click", ocultar_modal_pasos);
    }

    // para cambiar entre pantallas (vistas)
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

    // botones para elegir tipo de automata (AFN o AFD)
    const boton_afn = document.getElementById("boton_elegir_afn");
    const boton_afd = document.getElementById("boton_elegir_afd");
    const texto_descripcion_modo = document.getElementById("texto_descripcion_modo");
    const texto_ayuda_matriz = document.getElementById("texto_ayuda_matriz");
    const caja_seccion_matriz = document.getElementById("caja_seccion_matriz");
    const tabla_matriz = document.getElementById("tabla_matriz_transiciones");

    function seleccionar_afn() {
        tipo_automata_seleccionado = "AFN";
        boton_afn.className = "boton_tipo_activo";
        boton_afd.className = "boton_tipo_inactivo";

        if (texto_descripcion_modo) {
            texto_descripcion_modo.textContent = "Modo AFN: Permite transiciones vacías (ε) y múltiples estados destino separados por comas.";
        }
        if (texto_ayuda_matriz) {
            texto_ayuda_matriz.textContent = "En AFN separa destinos con comas (ej. q0, q1) o usa ε";
        }

        // Ocultamos la tabla anterior para obligar a regenerar
        caja_seccion_matriz.classList.add("ocultar");
        tabla_matriz.innerHTML = "";
    }

    function seleccionar_afd() {
        tipo_automata_seleccionado = "AFD";
        boton_afd.className = "boton_tipo_activo";
        boton_afn.className = "boton_tipo_inactivo";

        if (texto_descripcion_modo) {
            texto_descripcion_modo.textContent = "Modo AFD: Cada estado solo puede tener una única transición por símbolo (sin ε).";
        }
        if (texto_ayuda_matriz) {
            texto_ayuda_matriz.textContent = "En AFD solo se permite un único estado destino por casilla";
        }

        // Ocultamos la tabla anterior para obligar a regenerar
        caja_seccion_matriz.classList.add("ocultar");
        tabla_matriz.innerHTML = "";
    }

    boton_afn.addEventListener("click", seleccionar_afn);
    boton_afd.addEventListener("click", seleccionar_afd);

    // guardar referencias a los campos de estados, alfabeto, selector de estado inicial y checkboxes de estados finales
    const campo_estados = document.getElementById("campo_estados");
    const campo_alfabeto = document.getElementById("campo_alfabeto");
    const selector_inicial = document.getElementById("selector_estado_inicial");
    const caja_finales = document.getElementById("caja_estados_finales");

    // Funcion auxiliar para separar por comas y quitar espacios
    function limpiar_lista(texto) {
        if (!texto) return [];
        return texto.split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }

    function actualizar_opciones_estados() {
        const lista_estados = limpiar_lista(campo_estados.value);

        // Guardamos los que estaban marcados para no perderlos si solo edita el texto
        const estados_previamente_marcados = Array.from(
            document.querySelectorAll(".casilla_estado_final:checked")
        ).map((cb) => cb.value);

        // 1. Limpiar y llenar el selector desplegable (q0)
        const valor_inicial_anterior = selector_inicial.value;
        selector_inicial.innerHTML = "";
        if (lista_estados.length === 0) {
            selector_inicial.innerHTML = '<option value="">-- Ingresa primero los estados --</option>';
        } else {
            lista_estados.forEach((estado) => {
                const opcion = document.createElement("option");
                opcion.value = estado;
                opcion.textContent = estado;
                if (estado === valor_inicial_anterior) {
                    opcion.selected = true;
                }
                selector_inicial.appendChild(opcion);
            });
        }

        // 2. Limpiar y llenar los checkboxes para estados de aceptacion (F)
        caja_finales.innerHTML = "";
        if (lista_estados.length === 0) {
            caja_finales.innerHTML = '<span class="texto_ayuda_vacio">(Escribe los estados arriba)</span>';
        } else {
            lista_estados.forEach((estado) => {
                const etiqueta = document.createElement("label");
                etiqueta.style.display = "flex";
                etiqueta.style.alignItems = "center";
                etiqueta.style.gap = "4px";
                etiqueta.style.backgroundColor = "#1e293b";
                etiqueta.style.padding = "4px 8px";
                etiqueta.style.borderRadius = "4px";
                etiqueta.style.cursor = "pointer";

                const estaba_marcado = estados_previamente_marcados.includes(estado);

                etiqueta.innerHTML = `
                    <input type="checkbox" value="${estado}" class="casilla_estado_final" ${estaba_marcado ? "checked" : ""}>
                    <span>${estado}</span>
                `;
                caja_finales.appendChild(etiqueta);
            });
        }
    }

    // Cuando el usuario termina de escribir en el campo estados (sale del input)
    campo_estados.addEventListener("blur", actualizar_opciones_estados);

    // generar la tabla de transiciones
    const boton_generar_tabla = document.getElementById("boton_generar_tabla");

    boton_generar_tabla.addEventListener("click", () => {
        const estados = limpiar_lista(campo_estados.value);
        const alfabeto = limpiar_lista(campo_alfabeto.value);

        // Validamos que no esten vacios
        if (estados.length === 0 || alfabeto.length === 0) {
            alert("Por favor ingresa al menos un estado y un símbolo para el alfabeto.");
            return;
        }

        // Leemos cual es el inicial y cuales estan marcados como finales
        const estado_inicial = selector_inicial.value;
        const casillas_finales = document.querySelectorAll(".casilla_estado_final:checked");
        const estados_finales_marcados = Array.from(casillas_finales).map((cb) => cb.value);

        // Si es AFN agregamos la columna epsilon ε
        const columnas = [...alfabeto];
        if (tipo_automata_seleccionado === "AFN") {
            columnas.push("ε");
        }

        // Armamos la cabecera de la tabla
        let contenido_html = "<thead><tr>";
        contenido_html += '<th class="celda_estado_origen">Estado</th>';
        columnas.forEach((columna) => {
            contenido_html += `<th>${columna}</th>`;
        });
        contenido_html += "</tr></thead><tbody>";

        // Armamos cada fila con sus marcas formales (-> y *)
        estados.forEach((estado) => {
            const es_inicial = (estado === estado_inicial);
            const es_final = estados_finales_marcados.includes(estado);

            let prefijo_formal = "";
            if (es_inicial && es_final) {
                prefijo_formal = "→ * ";
            } else if (es_inicial) {
                prefijo_formal = "→ ";
            } else if (es_final) {
                prefijo_formal = "* ";
            }

            contenido_html += "<tr>";
            contenido_html += `<td class="celda_estado_origen">${prefijo_formal}${estado}</td>`;

            columnas.forEach((columna) => {
                const placeholder = tipo_automata_seleccionado === "AFN" ? "ej. q0, q1" : "ej. q1";
                contenido_html += `
                    <td>
                        <input type="text" 
                               data-origen="${estado}" 
                               data-simbolo="${columna}" 
                               placeholder="${placeholder}" 
                               class="input_celda_transicion celda_matriz_input">
                    </td>
                `;
            });

            contenido_html += "</tr>";
        });

        contenido_html += "</tbody>";

        // Pintamos la tabla y la mostramos
        tabla_matriz.innerHTML = contenido_html;
        caja_seccion_matriz.classList.remove("ocultar");
    });

});