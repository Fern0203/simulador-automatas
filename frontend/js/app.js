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
        // Ocultamos todas primero
        todas_las_vistas.forEach((vista) => {
            vista.classList.add("ocultar");
        });

        // Mostramos la elegida
        const vista_destino = document.getElementById(nombre_vista);
        if (vista_destino) {
            vista_destino.classList.remove("ocultar");
        }

        // Cerramos el menu lateral si estaba abierto
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

});