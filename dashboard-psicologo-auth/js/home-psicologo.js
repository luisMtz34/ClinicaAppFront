import { initFechaHoy, toYYYYMMDD, parseFechaLocal } from "./fechas-utils.js";
import { validarSesion, iniciarLogout } from "./session.js";
import { cargarNombrePsicologo } from "./psicologo-info.js";
import { cargarCitas } from "./citas-service.js";

let inputFecha, btnAnterior, btnHoy, btnSiguiente, btnFiltrar, btnTodas;

document.addEventListener("DOMContentLoaded", () => {
    initElements();
    validarSesion();
    cargarNombrePsicologo();
    initFechaHoy();
    cargarCitas(true);
    iniciarLogout();
});

function initElements() {
    inputFecha = document.getElementById("fechaFiltro");
    btnAnterior = document.getElementById("btnAnterior");
    btnHoy = document.getElementById("btnHoy");
    btnSiguiente = document.getElementById("btnSiguiente");
    btnFiltrar = document.getElementById("btnFiltrar");
    btnTodas = document.getElementById("btnTodas");

    if (btnHoy) btnHoy.addEventListener("click", onClickHoy);
    if (btnAnterior) btnAnterior.addEventListener("click", onClickAnterior);
    if (btnSiguiente) btnSiguiente.addEventListener("click", onClickSiguiente);

    if (inputFecha) inputFecha.addEventListener("change", () => cargarCitas(true));
    if (btnFiltrar) btnFiltrar.addEventListener("click", () => cargarCitas(true));
    if (btnTodas) btnTodas.addEventListener("click", () => cargarCitas(false));
}

function onClickHoy() {
    const hoy = new Date();
    inputFecha.value = toYYYYMMDD(hoy);
    cargarCitas(true);
}

window.verPagos = function (citaId) {
    if (!citaId) return;
    window.location.href = `../../dashboard-psicologo-pagos/pagos-psicologo.html?id=${citaId}`;
};


function onClickAnterior() {
    const fecha = parseFechaLocal(inputFecha.value);
    fecha.setDate(fecha.getDate() - 1);
    inputFecha.value = toYYYYMMDD(fecha);
    cargarCitas(true);
}

function onClickSiguiente() {
    const fecha = parseFechaLocal(inputFecha.value);
    fecha.setDate(fecha.getDate() + 1);
    inputFecha.value = toYYYYMMDD(fecha);
    cargarCitas(true);
}

export { inputFecha };
