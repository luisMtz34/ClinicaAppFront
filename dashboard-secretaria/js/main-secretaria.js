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

  // Mostrar fecha e inicializar
  mostrarFecha(fechaActual);
  generarTablaHorarios();
  inicializarDelegacionClick();
  inicializarModal();

  // 1️⃣ Primera carga usando fecha normalizada
  await cargarCitas(token, formatearFechaISO(fechaActual));

  // === Botón salir ===
  document.getElementById("btnSalir").addEventListener("click", () => {
    localStorage.removeItem("accessToken");
    window.location.href = "../index.html";
  });

  // === Botón anterior ===
  btnAnterior.addEventListener("click", async () => {
    fechaActual.setDate(fechaActual.getDate() - 1);

    mostrarFecha(fechaActual);
    generarTablaHorarios();

    const fechaNormal = formatearFechaISO(fechaActual);
    await cargarCitas(token, fechaNormal);
  });

  // === Botón siguiente ===
  btnSiguiente.addEventListener("click", async () => {
    fechaActual.setDate(fechaActual.getDate() + 1);

    mostrarFecha(fechaActual);
    generarTablaHorarios();

    const fechaNormal = formatearFechaISO(fechaActual);
    await cargarCitas(token, fechaNormal);
  });

  // === Input calendario ===
  inputCalendario.addEventListener("change", async (e) => {
    const fechaISO = e.target.value;
    if (!fechaISO) return;

    const [y, m, d] = fechaISO.split("-").map(Number);
    const nuevaFecha = new Date(y, m - 1, d);

    if (isNaN(nuevaFecha)) return;

    fechaActual = nuevaFecha;

    mostrarFecha(fechaActual);
    generarTablaHorarios();

    await cargarCitas(token, fechaISO); // ya viene YYYY-MM-DD
  });

  // === Botón HOY ===
  btnHoy.addEventListener("click", async () => {
    fechaActual = new Date();

    const hoyISO = formatearFechaISO(fechaActual);
    document.getElementById("inputFechaCalendario").value = hoyISO;

    mostrarFecha(fechaActual);
    generarTablaHorarios();

    await cargarCitas(token, hoyISO);
  });
});

// =========================
// 🔧 Normalizador de fechas
// =========================
export function normalizarFecha(fecha) {
  // Caso: viene como DD/MM/YYYY
  if (fecha.includes("/")) {
    const [d, m, y] = fecha.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Caso: viene como YYYY-MM-DD
  if (fecha.includes("-")) return fecha;

  return fecha;
}
