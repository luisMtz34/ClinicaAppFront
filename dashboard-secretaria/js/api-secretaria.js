// api-secretaria.js
import { generarTablaHorarios, inicializarDelegacionClick } from "./ui-tabla.js";
import { formatearFechaISO } from "./utils-fechas.js";

const BASE_URL = "http://localhost:8082/secretaria";
console.log(localStorage.getItem("accessToken"));

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
        const citasDelDia = citas.filter(c => c.fecha === fechaFiltro);

        generarTablaHorarios();

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

        // --- Dentro de registrarOActualizarCita ---
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

                // ✅ Guardar cita y estado
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

            // --- NO_ASISTIO ---
            if (nuevoEstado === "NO_ASISTIO" && nuevoEstado !== estadoOriginal) {
                const confirmar = await Swal.fire({
                    icon: "warning",
                    title: "Cita marcada como inasistencia",
                    text: "Se generará la penalización correspondiente para esta cita.",
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
                    window.location.href = `../dashboard-pagos/pagos.html?idCita=${idCita}&modo=penalizacion`;
                });

                return;
            }

            // --- Otros cambios de estado normales ---
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

        else {
            // 🔹 Nueva cita registrada
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

        document.getElementById("modalRegistrarCita").style.display = "none";
        await cargarCitas(token, cita.fecha);

    } catch (err) {
        console.error(err);
        alert("⚠️ No se pudo conectar con el servidor");
    }
}
