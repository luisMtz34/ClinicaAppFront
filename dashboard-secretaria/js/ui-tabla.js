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

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      resetearModal(form, btnGuardarCita, btnIrPagos, btnCerrar);
    }
  });

  // ✅ Aquí corregido
  nuevo.addEventListener("click", async (e) => {
    const celda = e.target.closest("td[data-consultorio]");
    if (!celda) return;

    const idCita = celda.dataset.id || "";
    const consultorio = celda.dataset.consultorio;
    const hora = celda.parentElement.cells[0].textContent.trim();
    const fecha = document.getElementById("inputFechaCalendario").value;
    const formContainer = document.getElementById("formContainer");

    try {
      await cargarListas();
      form.reset();

      const inputFecha = form.elements["fecha"];
      const inputHora = form.elements["hora"];
      const estadoSelect = form.elements["estado"];

      document.getElementById("consultorioSeleccionado").value = consultorio;
      inputFecha.value = fecha;
      inputHora.value = hora;

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
        estadoSelect.value = estadoOriginal;

        // --- Habilitar todos los campos excepto fecha y hora ---
        form.querySelectorAll("input, select, textarea").forEach(campo => {
          if (campo.id !== "fecha" && campo.id !== "hora") campo.disabled = false;
        });

        btnGuardarCita.style.display = "inline-block";
        btnIrPagos.style.display = "none";
        btnCerrar.textContent = "Cancelar";
        btnCerrar.style.margin = "initial";

        // --- Función para habilitar/deshabilitar fecha y hora ---
        const actualizarFechaHora = (estado) => {
          if (estado === "REAGENDADA") {
            inputFecha.disabled = false;
            inputHora.disabled = false;
          } else {
            inputFecha.disabled = true;
            inputHora.disabled = true;
          }
        };

        // Aplicar inicialmente
        actualizarFechaHora(estadoSelect.value);

        // Escuchar cambios en el select de estado
        estadoSelect.addEventListener("change", (e) => {
          actualizarFechaHora(e.target.value);
        });

        // --- Lógica según estado ---
        if (estadoOriginal === "ATENDIDA") {
          form.querySelectorAll("input, select, textarea").forEach(campo => campo.disabled = true);
          btnGuardarCita.style.display = "none";
          btnCerrar.textContent = "Cerrar";
          btnCerrar.style.margin = "0 auto";
          btnIrPagos.style.display = "inline-block";
          btnIrPagos.textContent = "Ver pago";

          btnIrPagos.onclick = (ev) => {
            ev.stopPropagation();
            modal.style.display = "none";
            window.location.href = `/dashboard-pagos/pagos.html?idCita=${idCita}&modo=ver`;
          };
        } else if (estadoOriginal === "NO_ASISTIO") {
          form.querySelectorAll("input, select, textarea").forEach(campo => campo.disabled = true);
          btnGuardarCita.style.display = "none";
          btnCerrar.textContent = "Cerrar";
          btnCerrar.style.margin = "0 auto";
          btnIrPagos.style.display = "inline-block";

          try {
            const token = localStorage.getItem("accessToken");
            const resp = await fetch(`${CONFIG.API_BASE_URL}/pagos/cita/${idCita}`, {
              headers: { Authorization: "Bearer " + token },
            });

            const pagos = await resp.json();
            const yaTienePenalizacion = pagos.some(p => p.tipoPago === "PENALIZACION");

            if (yaTienePenalizacion) {
              btnIrPagos.textContent = "Ver penalización";
              btnIrPagos.onclick = (ev) => {
                ev.stopPropagation();
                modal.style.display = "none";
                window.location.href = `/dashboard-pagos/pagos.html?idCita=${idCita}&modo=ver`;
              };
            } else {
              btnIrPagos.textContent = "Registrar penalización";
              btnIrPagos.onclick = (ev) => {
                ev.stopPropagation();
                modal.style.display = "none";
                window.location.href = `/dashboard-pagos/pagos.html?idCita=${idCita}&modo=penalizacion`;
              };
            }
          } catch (err) {
            console.error("Error al verificar penalización:", err);
          }
        }

        modal.style.display = "flex";
      } else {
        // Nueva cita
        formContainer.style.display = "block";
        document.getElementById("idCita").value = "";
        btnGuardarCita.textContent = "Guardar";
        document.getElementById("estadoContainer").style.display = "none";
        modal.style.display = "flex";

        // Fecha y hora deshabilitadas por defecto
        inputFecha.disabled = true;
        inputHora.disabled = true;
      }

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "⚠️ No se pudo conectar con el servidor. Intenta nuevamente.",
        confirmButtonColor: "#d33"
      });
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



