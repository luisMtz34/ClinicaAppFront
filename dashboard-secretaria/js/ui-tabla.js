// ui-tabla.js
import { cargarListas } from "./api-secretaria.js";

export function generarTablaHorarios() {
  const horas = [9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20];
  const tabla = document.getElementById("tablaCitas");
  tabla.innerHTML = "";

  horas.forEach(hora => {
    const fila = document.createElement("tr");
    const horaFormateada = `${hora.toString().padStart(2, "0")}:00`;
    fila.innerHTML = `
      <td>${horaFormateada}</td>
      <td data-consultorio="C1"></td>
      <td data-consultorio="C2"></td>
      <td data-consultorio="C3"></td>
      <td data-consultorio="C4"></td>
    `;
    tabla.appendChild(fila);
  });
}

// === Delegación de clics en las celdas ===
export function inicializarDelegacionClick() {
  const tabla = document.getElementById("tablaCitas");
  const nuevo = tabla.cloneNode(true);
  tabla.parentNode.replaceChild(nuevo, tabla);

  nuevo.addEventListener("click", async (e) => {
    const celda = e.target.closest("td[data-consultorio]");
    if (!celda) return;

    const idCita = celda.dataset.id || "";
    const consultorio = celda.dataset.consultorio;
    const hora = celda.parentElement.cells[0].textContent.trim();
    const fecha = document.getElementById("inputFechaCalendario").value;

    const form = document.getElementById("formRegistrarCita");
    const modal = document.getElementById("modalRegistrarCita");
    modal.style.display = "flex";

    try {
      await cargarListas();
      form.reset();

      document.getElementById("consultorioSeleccionado").value = consultorio;
      document.getElementById("fecha").value = fecha;
      document.getElementById("hora").value = hora;

      if (idCita) {
        document.getElementById("idCita").value = idCita;
        document.getElementById("btnGuardarCita").textContent = "Actualizar";
        document.getElementById("estadoContainer").style.display = "block";

        document.getElementById("tipo").value = celda.dataset.tipo || "";
        document.getElementById("observaciones").value = celda.dataset.observaciones || "";
        document.getElementById("psicologo").value = celda.dataset.psicologoId || "";
        document.getElementById("paciente").value = celda.dataset.pacienteId || "";
        document.getElementById("estado").value = celda.dataset.estado || "ACTIVO";
        document.getElementById("estado").dataset.original = celda.dataset.estado || "ACTIVO";
      } else {
        document.getElementById("idCita").value = "";
        document.getElementById("btnGuardarCita").textContent = "Guardar";
        document.getElementById("estadoContainer").style.display = "none";
      }
    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar psicólogos o pacientes");
    }
  });
}
