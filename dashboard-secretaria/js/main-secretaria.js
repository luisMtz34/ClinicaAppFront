// main-secretaria.js
import { mostrarFecha, formatearFechaISO } from "./utils-fechas.js";
import { generarTablaHorarios, inicializarDelegacionClick } from "./ui-tabla.js";
import { inicializarModal } from "./ui-modal.js";
import { cargarCitas } from "./api-secretaria.js";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("btnVerTodas").addEventListener("click", () => {
    window.location.href = "../dashboard-ver-citas/verCitas.html";
  });


  const btnAnterior = document.getElementById("btnAnterior");
  const btnSiguiente = document.getElementById("btnSiguiente");
  const inputCalendario = document.getElementById("inputFechaCalendario");
  const btnHoy = document.getElementById("btnHoy");

  let fechaActual = new Date();

  mostrarFecha(fechaActual);
  generarTablaHorarios();
  inicializarDelegacionClick();
  inicializarModal();
  await cargarCitas(token, formatearFechaISO(fechaActual));

  // === Botones ===
  document.getElementById("btnSalir").addEventListener("click", () => {
    localStorage.removeItem("accessToken");
    window.location.href = "../index.html";
  });

  btnAnterior.addEventListener("click", async () => {
    fechaActual.setDate(fechaActual.getDate() - 1);
    mostrarFecha(fechaActual);
    generarTablaHorarios();
    await cargarCitas(token, fechaActual);
  });

  btnSiguiente.addEventListener("click", async () => {
    fechaActual.setDate(fechaActual.getDate() + 1);
    mostrarFecha(fechaActual);
    generarTablaHorarios();
    await cargarCitas(token, fechaActual);
  });

  inputCalendario.addEventListener("change", async (e) => {
    const [y, m, d] = e.target.value.split("-").map(Number);
    const nuevaFecha = new Date(y, m - 1, d);
    if (isNaN(nuevaFecha)) return;

    fechaActual = nuevaFecha;
    mostrarFecha(fechaActual);
    generarTablaHorarios();
    await cargarCitas(token, e.target.value);
  });

  btnHoy.addEventListener("click", async () => {
    fechaActual = new Date();
    document.getElementById("inputFechaCalendario").value = formatearFechaISO(fechaActual);
    mostrarFecha(fechaActual);
    generarTablaHorarios();
    await cargarCitas(token, formatearFechaISO(fechaActual));
  });
});
