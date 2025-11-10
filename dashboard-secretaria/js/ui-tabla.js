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

export function inicializarDelegacionClick() {
  const tabla = document.getElementById("tablaCitas");
  const nuevo = tabla.cloneNode(true);
  tabla.parentNode.replaceChild(nuevo, tabla);

  const modal = document.getElementById("modalRegistrarCita");
  const form = document.getElementById("formRegistrarCita");
  const btnCerrar = document.getElementById("cancelarRegistrarCita");
  const btnGuardarCita = document.getElementById("btnGuardarCita");
  const btnIrPagos = document.getElementById("btnIrPagos");

  btnCerrar.addEventListener("click", () => {
    modal.style.display = "none";
    resetearModal(form, btnGuardarCita, btnIrPagos, btnCerrar);
  });

  // 🔹 Cerrar modal al hacer clic fuera
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      resetearModal(form, btnGuardarCita, btnIrPagos, btnCerrar);
    }
  });

  nuevo.addEventListener("click", async (e) => {
    const celda = e.target.closest("td[data-consultorio]");
    if (!celda) return;

    const idCita = celda.dataset.id || "";
    const consultorio = celda.dataset.consultorio;
    const hora = celda.parentElement.cells[0].textContent.trim();
    const fecha = document.getElementById("inputFechaCalendario").value;
    const formContainer = document.getElementById("formContainer");

    modal.style.display = "flex";

    try {
      await cargarListas();
      form.reset();

      document.getElementById("consultorioSeleccionado").value = consultorio;
      document.getElementById("fecha").value = fecha;
      document.getElementById("hora").value = hora;

      if (idCita) {
        const estadoOriginal = celda.dataset.estado || "ACTIVO";

        formContainer.style.display = "block";
        document.getElementById("idCita").value = idCita;
        btnGuardarCita.textContent = "Actualizar";
        document.getElementById("estadoContainer").style.display = "block";

        document.getElementById("tipo").value = celda.dataset.tipo || "";
        document.getElementById("observaciones").value = celda.dataset.observaciones || "";
        document.getElementById("psicologo").value = celda.dataset.psicologoId || "";
        document.getElementById("paciente").value = celda.dataset.pacienteId || "";
        document.getElementById("estado").value = estadoOriginal;

        // 🔹 Reset visual
        form.querySelectorAll("input, select, textarea").forEach(campo => campo.disabled = false);
        btnGuardarCita.style.display = "inline-block";
        btnIrPagos.style.display = "none";
        btnCerrar.textContent = "Cancelar";
        btnCerrar.style.margin = "initial";

        // --- Lógica según estado ---
        if (estadoOriginal === "ATENDIDA") {
          form.querySelectorAll("input, select, textarea").forEach(campo => campo.disabled = true);
          btnGuardarCita.style.display = "none";
          btnCerrar.textContent = "Cerrar";
          btnCerrar.style.margin = "0 auto";
          btnIrPagos.style.display = "inline-block";
          btnIrPagos.textContent = "Ver pago";
          btnIrPagos.onclick = () => {
            window.location.href = `/dashboard-pagos/pagos.html?idCita=${idCita}&modo=ver`;
          };
        } else if (estadoOriginal === "NO_ASISTIO") {
          form.querySelectorAll("input, select, textarea").forEach(campo => campo.disabled = true);
          btnGuardarCita.style.display = "none";
          btnCerrar.textContent = "Cerrar";
          btnCerrar.style.margin = "0 auto";
          btnIrPagos.style.display = "inline-block";
          btnIrPagos.textContent = "Registrar penalización";
          btnIrPagos.onclick = () => {
            window.location.href = `/dashboard-pagos/pagos.html?idCita=${idCita}&modo=penalizacion`;
          };
        }

      } else {
        formContainer.style.display = "block";
        document.getElementById("idCita").value = "";
        btnGuardarCita.textContent = "Guardar";
        document.getElementById("estadoContainer").style.display = "none";
      }

    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar psicólogos o pacientes");
    }
  });
}

function resetearModal(form, btnGuardarCita, btnIrPagos, btnCerrar) {
  form.querySelectorAll("input, select, textarea").forEach(campo => campo.disabled = false);
  btnGuardarCita.style.display = "inline-block";
  btnIrPagos.style.display = "none";
  btnCerrar.textContent = "Cancelar";
  btnCerrar.style.margin = "initial";
}



