import { registrarOActualizarCita } from "./api-secretaria.js";

export function inicializarModal() {
  const modal = document.getElementById("modalRegistrarCita");
  const form = document.getElementById("formRegistrarCita");
  const btnCancelar = document.getElementById("cancelarRegistrarCita");
  const btnActualizar = document.getElementById("btnActualizarCita"); // asegúrate que exista este ID en el HTML

  // Cerrar con botón cancelar
  btnCancelar.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Cerrar al hacer clic fuera del modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Evento del formulario
  form.addEventListener("submit", registrarOActualizarCita);
}

/**
 * Función que se llama al abrir el modal con una cita existente
 * @param {Object} cita - Datos de la cita seleccionada
 */
export function mostrarModalCita(cita) {
  const modal = document.getElementById("modalRegistrarCita");
  const form = document.getElementById("formRegistrarCita");
  const estadoSelect = form.elements["estado"];
  const inputFecha = form.elements["fecha"];
  const selectHora = form.elements["hora"];

  modal.style.display = "block";

  // --- Rellenar campos ---
  form.elements["idCita"].value = cita.id || "";
  inputFecha.value = cita.fecha || "";
  selectHora.value = cita.hora || ""; // hora de la cita se selecciona por defecto
  estadoSelect.value = cita.estado || "";

  // --- Inicialmente deshabilitado ---
  inputFecha.disabled = true;
  selectHora.disabled = true;

  // --- Función para habilitar/deshabilitar según estado ---
  const actualizarFechaHora = (estado) => {
    if (estado === "REAGENDADA") {
      inputFecha.disabled = false;
      selectHora.disabled = false;
    } else {
      inputFecha.disabled = true;
      selectHora.disabled = true;
    }
  };

  // Aplicar estado al abrir modal
  actualizarFechaHora(estadoSelect.value);

  // Escuchar cambios en el select de estado
  estadoSelect.addEventListener("change", (e) => {
    actualizarFechaHora(e.target.value);
  });
}
