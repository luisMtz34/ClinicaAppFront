// api-secretaria.js
import { generarTablaHorarios, inicializarDelegacionClick } from "./ui-tabla.js";
import { formatearFechaISO } from "./utils-fechas.js";

const BASE_URL = "http://localhost:8082/secretaria";

export async function cargarListas() {
    const token = localStorage.getItem("accessToken");
    const [psicRes, pacRes] = await Promise.all([
        fetch(`${BASE_URL}/psicologos`, { headers: { "Authorization": "Bearer " + token } }),
        fetch(`${BASE_URL}/pacientes`, { headers: { "Authorization": "Bearer " + token } }),

    ]);


    const [psicologos, pacientes] = await Promise.all([psicRes.json(), pacRes.json()]);

    const selectPsico = document.getElementById("psicologo");
    const selectPac = document.getElementById("paciente");
    const selectTipo = document.getElementById("tipo");
    selectPsico.innerHTML = "";
    selectPac.innerHTML = "";

    psicologos.forEach(p => {
        selectPsico.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });
    pacientes.forEach(p => {
        selectPac.innerHTML += `<option value="${p.clave}">${p.nombre}</option>`;
    });

}

export async function cargarCitas(token, fechaSeleccionada) {
    try {
        const fechaFiltro = typeof fechaSeleccionada === "string"
            ? fechaSeleccionada
            : formatearFechaISO(fechaSeleccionada);

        const response = await fetch(`${BASE_URL}/citas`, {
            headers: { "Authorization": "Bearer " + token },
        });
        if (!response.ok) throw new Error("Error cargando citas");

        const citas = await response.json();
        const citasDelDia = citas.filter(c =>
            c.fecha === fechaFiltro && c.estado !== "CANCELADA"
        );

        // Limpiar y construir tabla en blanco
        generarTablaHorarios();

        // Rellenar la tabla con las citas del día (esto pone dataset.id en las celdas ocupadas)
        citasDelDia.forEach(cita => {
            const horaCita = (cita.hora || "").substring(0, 5);
            document.querySelectorAll("#tablaCitas tr").forEach(fila => {
                if (fila.cells[0].textContent.trim() === horaCita) {
                    const celda = fila.querySelector(`[data-consultorio='${cita.consultorio}']`);
                    if (celda) {
                        celda.textContent = `${cita.pacienteNombre} - ${cita.psicologoNombre}`;
                        celda.style.background = "#d0e6f7";
                        celda.style.cursor = "pointer";

                        const pago = cita.pagoInicialMonto ||
                            (cita.pagos && cita.pagos.reduce((sum, p) => sum + p.monto, 0)) || 0;

                        Object.assign(celda.dataset, {
                            id: cita.idCitas,
                            psicologoId: cita.psicologoId,
                            psicologoNombre: cita.psicologoNombre,
                            pacienteId: cita.pacienteId,
                            pacienteNombre: cita.pacienteNombre,
                            tipo: cita.tipo || "",
                            observaciones: cita.observaciones || "",
                            estado: cita.estado || "ACTIVO",
                            fecha: cita.fecha,
                            hora: horaCita,
                            pago: pago
                        });
                    }
                }
            });
        });

        // --- BLOQUEO: solo después de haber asignado dataset a celdas ocupadas ---
        const hoy = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'
        // bloqueo solo si la fecha de vista es anterior a hoy
        // LIMPIAR CUALQUIER HORA, ESPACIOS O FORMATO RARO
        // usar la fecha LOCAL para evitar problemas con UTC/toISOString()
        const fechaVistaStr = (fechaFiltro || "").split("T")[0].trim();

        // calcular 'hoy' en local YYYY-MM-DD (no UTC)
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const fechaHoyStr = `${yyyy}-${mm}-${dd}`;

        // comparar strings YYYY-MM-DD (funciona porque formato lexicográficamente ordena)
        const esFechaPasada = fechaVistaStr && fechaVistaStr < fechaHoyStr;




        document.querySelectorAll("#tablaCitas td[data-consultorio]").forEach(celda => {
            if (esFechaPasada && !celda.dataset.id) {
                // bloquear solo libres
                celda.style.background = "#eeeeee";
                celda.style.cursor = "not-allowed";
                celda.style.pointerEvents = "none";
            } else if (!celda.dataset.id) {
                // habilitar si no es fecha pasada
                celda.style.background = "";
                celda.style.cursor = "pointer";
                celda.style.pointerEvents = "auto";
            }
        });
        inicializarDelegacionClick();
    } catch (err) {
        console.error(err);
        Swal.fire({
            icon: "error",
            title: "❌ Error al cargar las citas",
            text: "No se pudieron cargar las citas.",
            confirmButtonColor: "#d33"
        });
    }
}


export async function registrarOActualizarCita(e) {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    const idCita = document.getElementById("idCita").value;
    const esEdicion = idCita !== "";

    const cita = {
        fecha: document.getElementById("fecha").value,
        hora: document.getElementById("hora").value + ":00",
        consultorio: document.getElementById("consultorioSeleccionado").value,
        tipo: document.getElementById("tipo").value,
        observaciones: document.getElementById("observaciones").value,
        psicologoId: document.getElementById("psicologo").value,
        pacienteId: document.getElementById("paciente").value
    };

    try {
        const url = esEdicion
            ? `${BASE_URL}/citas/${idCita}`
            : `${BASE_URL}/citas/registrar`;

        const method = esEdicion ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify(cita)
        });

        if (res.status === 409) {
            Swal.fire({
                icon: "warning",
                title: "⚠️ Cita duplicada",
                text: "El paciente ya tiene una cita registrada en esta fecha.",
                confirmButtonColor: "#f39c12"
            });
            return;
        }

        if (!res.ok) throw new Error("Error al guardar la cita");

        // --- EDICIÓN ---
        if (esEdicion) {
            const nuevoEstado = document.getElementById("estado").value;
            const estadoOriginal = document.getElementById("estado").dataset.original;

            // --- ATENDIDA ---
            if (nuevoEstado === "ATENDIDA" && nuevoEstado !== estadoOriginal) {
                const confirmar = await Swal.fire({
                    icon: "info",
                    title: "Cita atendida",
                    text: "Vas a marcar esta cita como atendida. Se generará el pago correspondiente.",
                    showCancelButton: true,
                    confirmButtonText: "Continuar",
                    cancelButtonText: "Cancelar",
                });

                if (!confirmar.isConfirmed) return;

                await fetch(`${BASE_URL}/citas/${idCita}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify({ ...cita, estado: nuevoEstado })
                });

                Swal.fire({
                    icon: "success",
                    title: "Cita actualizada",
                    text: "Ahora registra el pago correspondiente.",
                    confirmButtonText: "Ir a pagos"
                }).then(() => {
                    window.location.href = `../dashboard-pagos/pagos.html?idCita=${idCita}`;
                });

                return;
            }

            // --- CANCELADA ---
            if (nuevoEstado === "CANCELADA" && nuevoEstado !== estadoOriginal) {
                await fetch(`${BASE_URL}/citas/${idCita}/estado?estado=${nuevoEstado}`, {
                    method: "PUT",
                    headers: { "Authorization": "Bearer " + token }
                });

                Swal.fire({
                    icon: "success",
                    title: "Cita marcada como CANCELADA",
                    text: "El espacio ha quedado libre y la cita se guardó en historial.",
                    confirmButtonText: "Aceptar"
                }).then(async () => {

                    document.getElementById("modalRegistrarCita").style.display = "none";

                    // Si no existe, usa la del formulario
                    const fechaRecargar = document.getElementById("fecha").value;

                    // Actualizar encabezado si existe
                    const header = document.getElementById("fechaActual");
                    if (header) header.textContent = formatDisplayDate(fechaRecargar);

                    await cargarCitas(token, fechaRecargar);
                });

                return;
            }

            // --- NO ASISTIÓ ---
            if (nuevoEstado === "NO_ASISTIO" && nuevoEstado !== estadoOriginal) {
                const confirmar = await Swal.fire({
                    icon: "warning",
                    title: "Cita marcada como inasistencia",
                    text: "Se generará la penalización correspondiente.",
                    showCancelButton: true,
                    confirmButtonText: "Continuar",
                    cancelButtonText: "Cancelar",
                });

                if (!confirmar.isConfirmed) return;

                await fetch(`${BASE_URL}/citas/${idCita}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify({ ...cita, estado: nuevoEstado })
                });

                Swal.fire({
                    icon: "success",
                    title: "Cita actualizada",
                    text: "Ahora registra la penalización correspondiente.",
                    confirmButtonText: "Ir a penalización"
                }).then(() => {
                    window.location.href =
                        `../dashboard-pagos/pagos.html?idCita=${idCita}&modo=penalizacion`;
                });

                return;
            }

            // --- OTROS CAMBIOS DE ESTADO ---
            if (nuevoEstado !== estadoOriginal) {
                await fetch(`${BASE_URL}/citas/${idCita}/estado?estado=${nuevoEstado}`, {
                    method: "PUT",
                    headers: { "Authorization": "Bearer " + token }
                });
            }

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Cita actualizada correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
        }

        // --- NUEVA CITA ---
        else {
            Swal.fire({
                icon: "success",
                title: "✅ Cita registrada correctamente",
                text: "Se ha guardado la cita con éxito.",
                timer: 2000,
                showConfirmButton: false,
                position: "top-end",
                toast: true
            });
        }

        // --- CERRAR MODAL Y RECARGAR TABLA ---
        document.getElementById("modalRegistrarCita").style.display = "none";

        // Tomar la fecha del calendario si existe
        const fechaCalendario = document.getElementById("inputFechaCalendario")?.value;

        // Si no existe, usa la del formulario
        const fechaRecargar = fechaCalendario || document.getElementById("fecha").value;

        await cargarCitas(token, fechaRecargar);

    } catch (err) {
        console.error(err);
        alert("⚠️ No se pudo conectar con el servidor");
    }
}

// ----- Helper -----
function formatDisplayDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}
