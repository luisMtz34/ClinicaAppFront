// utils-fechas.js

// === Mostrar la fecha actual y sincronizar calendario ===
export function mostrarFecha(fecha) {
  const opciones = { day: "2-digit", month: "short", year: "numeric" };
  document.getElementById("fechaActual").textContent =
    fecha.toLocaleDateString("es-ES", opciones);

  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  document.getElementById("inputFechaCalendario").value = `${yyyy}-${mm}-${dd}`;
}

// === Convierte una fecha a formato YYYY-MM-DD ===
export function formatearFechaISO(fecha) {
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
