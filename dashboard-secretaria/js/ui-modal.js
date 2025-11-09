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
  const btnActualizar = document.getElementById("btnActualizarCita");
  const btnCancelar = document.getElementById("cancelarRegistrarCita");

  modal.style.display = "block";

  // Rellenar los campos con los datos de la cita
  form.elements["idCita"].value = cita.id;
  form.elements["fecha"].value = cita.fecha;
  form.elements["hora"].value = cita.hora;
  form.elements["estado"].value = cita.estado;
  // ... (otros campos)

  // --- Nueva lógica ---
  if (cita.estado === "ATENDIDA") {
    // Desactivar todos los campos del formulario
    Array.from(form.elements).forEach((el) => (el.disabled = true));

    // Ocultar botón de actualizar
    btnActualizar.style.display = "none";

    // Cambiar texto del botón cancelar a "Cerrar"
    btnCancelar.textContent = "Cerrar";
    btnCancelar.disabled = false;
  } else {
    // Si la cita no está atendida, mantener comportamiento normal
    Array.from(form.elements).forEach((el) => (el.disabled = false));

    btnActualizar.style.display = "inline-block";
    btnCancelar.textContent = "Cancelar";
  }
}
