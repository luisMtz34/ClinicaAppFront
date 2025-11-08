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

  nuevo.addEventListener("click", async (e) => {
    const celda = e.target.closest("td[data-consultorio]");
    if (!celda) return;

    const idCita = celda.dataset.id || "";
    const consultorio = celda.dataset.consultorio;
    const hora = celda.parentElement.cells[0].textContent.trim();
    const fecha = document.getElementById("inputFechaCalendario").value;

    const form = document.getElementById("formRegistrarCita");
    const formContainer = document.getElementById("formContainer");
    const resumen = document.getElementById("resumenCitaContainer");
    const modal = document.getElementById("modalRegistrarCita");

    modal.style.display = "flex";

    try {
      await cargarListas();
      form.reset();

      document.getElementById("consultorioSeleccionado").value = consultorio;
      document.getElementById("fecha").value = fecha;
      document.getElementById("hora").value = hora;

      if (idCita) {
        const estado = celda.dataset.estado || "ACTIVO";

        if (estado === "ATENDIDA" || estado === "NO_ASISTIO") {
          // Mostrar solo el resumen
          formContainer.style.display = "none";
          resumen.style.display = "block";

          document.getElementById("resumenPaciente").textContent = celda.dataset.pacienteNombre || "";
          document.getElementById("resumenPsicologo").textContent = celda.dataset.psicologoNombre || "";
          document.getElementById("resumenTipo").textContent = celda.dataset.tipo || "";
          document.getElementById("resumenFechaHora").textContent = `${fecha} ${hora}`;
          document.getElementById("resumenObservaciones").textContent = celda.dataset.observaciones || "";
          document.getElementById("resumenEstado").textContent =
            estado === "ATENDIDA" ? "La cita ha sido atendida" : "No asistió";
          document.getElementById("resumenPago").textContent = "Pago generado: $" + (celda.dataset.pago || "0");

          // Mostrar pagos asociados
          const tablaPagosBody = document.querySelector("#tablaPagosResumen tbody");
          tablaPagosBody.innerHTML = "";

          try {
            const token = localStorage.getItem("accessToken");
            const resp = await fetch(`http://localhost:8082/secretaria/citas/${idCita}`, {
              headers: { "Authorization": "Bearer " + token },
            });

            if (resp.ok) {
              const citaDetallada = await resp.json();
              const pagosCitaActual = citaDetallada.pagos || [];

              if (pagosCitaActual.length > 0) {
                // Ordenar pagos: penalizaciones primero
                const pagosOrdenados = pagosCitaActual.sort((a, b) => {
                  if (a.tipoPago === "PENALIZACION" && b.tipoPago !== "PENALIZACION") return -1;
                  if (a.tipoPago !== "PENALIZACION" && b.tipoPago === "PENALIZACION") return 1;
                  return new Date(a.fecha) - new Date(b.fecha);
                });

                // Evitar duplicados exactos: mismo tipo + mismo motivo + misma fecha
                const pagosMostrados = new Set();
                const pagosFiltrados = pagosOrdenados.filter(p => {
                  const key = `${p.tipoPago}-${p.motivo}-${p.fecha}`;
                  if (pagosMostrados.has(key)) return false;
                  pagosMostrados.add(key);
                  return true;
                });

                let total = 0;
                let montoPenalizacion = 0;

                // Renderizar pagos filtrados
                pagosFiltrados.forEach(pago => {
                  let montoMostrado = pago.montoTotal || 0;

                  if (pago.tipoPago === "PENALIZACION") {
                    montoPenalizacion += pago.montoTotal || 0;
                    total += pago.montoTotal || 0;
                  } else if (pago.tipoPago === "PAGO_NORMAL") {
                    montoMostrado = Math.max(0, pago.montoTotal - montoPenalizacion);
                    total += montoMostrado;
                  } else {
                    total += pago.montoTotal || 0;
                  }

                  const fila = document.createElement("tr");
                  fila.innerHTML = `
                <td>${pago.tipoPago || "-"}</td>
                <td>$${montoMostrado.toFixed(2)}</td>
                <td>${new Date(pago.fecha).toLocaleString()}</td>
                <td>${pago.motivo || "-"}</td>
              `;
                  tablaPagosBody.appendChild(fila);
                });

                // Fila de total
                const filaTotal = document.createElement("tr");
                filaTotal.innerHTML = `
              <td style="font-weight:bold;">TOTAL</td>
              <td style="font-weight:bold;">$${total.toFixed(2)}</td>
              <td colspan="2"></td>
            `;
                tablaPagosBody.appendChild(filaTotal);

              } else {
                tablaPagosBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay pagos registrados</td></tr>`;
              }

            } else {
              tablaPagosBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Error al cargar pagos</td></tr>`;
            }

          } catch (error) {
            console.error("Error al obtener pagos:", error);
            tablaPagosBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No se pudieron cargar los pagos</td></tr>`;
          }

        } else {
          // Mostrar formulario para editar
          formContainer.style.display = "block";
          resumen.style.display = "none";

          document.getElementById("idCita").value = idCita;
          document.getElementById("btnGuardarCita").textContent = "Actualizar";
          document.getElementById("estadoContainer").style.display = "block";

          document.getElementById("tipo").value = celda.dataset.tipo || "";
          document.getElementById("observaciones").value = celda.dataset.observaciones || "";
          document.getElementById("psicologo").value = celda.dataset.psicologoId || "";
          document.getElementById("paciente").value = celda.dataset.pacienteId || "";
          document.getElementById("estado").value = estado;
          document.getElementById("estado").dataset.original = estado;
        }
      } else {
        // Nueva cita
        formContainer.style.display = "block";
        resumen.style.display = "none";

        document.getElementById("idCita").value = "";
        document.getElementById("btnGuardarCita").textContent = "Guardar";
        document.getElementById("estadoContainer").style.display = "none";
      }

      // Botón cerrar resumen
      document.getElementById("cerrarResumen").onclick = () => {
        modal.style.display = "none";
      };

    } catch (err) {
      console.error(err);
      alert("No se pudieron cargar psicólogos o pacientes");
    }

  });
}


