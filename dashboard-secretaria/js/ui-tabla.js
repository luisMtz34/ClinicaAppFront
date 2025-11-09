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

  // 🔹 Listener único: cerrar modal y restaurar formulario
  btnCerrar.addEventListener("click", () => {
    modal.style.display = "none";

    // Rehabilitar todos los campos
    form.querySelectorAll("input, select, textarea").forEach(campo => {
      campo.disabled = false;
    });

    // Restaurar estado inicial de los botones
    btnGuardarCita.style.display = "inline-block";
    btnIrPagos.style.display = "none";
    btnCerrar.textContent = "Cancelar";
    btnCerrar.style.margin = "initial";
  });

  // 🔹 Evento al hacer clic en una celda de la tabla
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
        // --- Editar cita existente ---
        const estado = celda.dataset.estado || "ACTIVO";
        const estadoSelect = document.getElementById("estado");
        const estadoOriginal = estado;

        formContainer.style.display = "block";
        document.getElementById("idCita").value = idCita;
        btnGuardarCita.textContent = "Actualizar";
        document.getElementById("estadoContainer").style.display = "block";

        document.getElementById("tipo").value = celda.dataset.tipo || "";
        document.getElementById("observaciones").value = celda.dataset.observaciones || "";
        document.getElementById("psicologo").value = celda.dataset.psicologoId || "";
        document.getElementById("paciente").value = celda.dataset.pacienteId || "";
        estadoSelect.value = estado;
        estadoSelect.dataset.original = estado;

        // --- Lógica visual solo si ya fue ATENDIDA ---
        if (estadoOriginal === "ATENDIDA") {
          btnIrPagos.style.display = "inline-block";
          btnIrPagos.textContent = "Ver pago";

          // Desactivar campos
          form.querySelectorAll("input, select, textarea").forEach(campo => {
            campo.disabled = true;
          });

          // Ocultar actualizar y dejar solo cerrar
          btnGuardarCita.style.display = "none";
          btnCerrar.textContent = "Cerrar";
          btnCerrar.style.margin = "0 auto";
        } else {
          btnIrPagos.style.display = "none";
          btnGuardarCita.style.display = "inline-block";
          btnCerrar.textContent = "Cancelar";
          btnCerrar.style.margin = "initial";
        }

        // --- Acción del botón de pago ---
        btnIrPagos.onclick = () => {
          const idCitaActual = document.getElementById("idCita").value;
          window.location.href = `/dashboard-pagos/pagos.html?idCita=${idCitaActual}`;
        };
      } else {
        // --- Nueva cita ---
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




