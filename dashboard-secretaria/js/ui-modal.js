// ui-modal.js
import { registrarOActualizarCita } from "./api-secretaria.js";

export function inicializarModal() {
  const modal = document.getElementById("modalRegistrarCita");

  // Cerrar con botón cancelar
  document.getElementById("cancelarRegistrarCita").addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Cerrar al hacer clic fuera
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Evento del formulario
  document.getElementById("formRegistrarCita").addEventListener("submit", registrarOActualizarCita);
}
