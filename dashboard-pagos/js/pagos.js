document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idCita = urlParams.get("idCita");
    const modo = urlParams.get("modo"); // puede ser "ver" o null

    const modal = document.getElementById("modalPago");
    const form = document.getElementById("formPago");
    const listaPagos = document.getElementById("listaPagos");
    const btnCancelar = document.getElementById("btnCancelar");

    function ajustarCamposSegunModo(form, modo) {
        const campoComision = form.querySelector("[name='comisionClinica']").closest(".campo");
        const campoTipoPago = form.querySelector("[name='tipoPago']").closest(".campo");
        const campoPenalizacion = form.querySelector("[name='penalizacion']").closest(".campo");
        const campoMonto = form.querySelector("[name='montoTotal']").closest(".campo");
        const campoMotivo = form.querySelector("[name='motivo']").closest(".campo");
        const campoObs = form.querySelector("[name='observaciones']").closest(".campo");
        const tipoPagoSelect = form.querySelector("[name='tipoPago']");
        const comisionInput = form.querySelector("[name='comisionClinica']");

        // ✅ Si no hay modo, lo tratamos como "registro" por defecto
        modo = (modo || "registro").toLowerCase();

        if (modo === "penalizacion") {
            // Mostrar solo estos
            campoMonto.classList.remove("oculto");
            campoMotivo.classList.remove("oculto");
            campoObs.classList.remove("oculto");

            // Ocultar los demás
            campoComision.classList.add("oculto");
            campoTipoPago.classList.add("oculto");
            campoPenalizacion.classList.add("oculto");

            // Quitar required de los ocultos
            tipoPagoSelect.removeAttribute("required");
            comisionInput.removeAttribute("required");

            // Fijar valores
            tipoPagoSelect.value = "PENALIZACION";
            comisionInput.value = 0;
        }
        else if (modo === "atendida") {
            // Mostrar estos
            campoMonto.classList.remove("oculto");
            campoComision.classList.remove("oculto");
            campoMotivo.classList.remove("oculto");
            campoTipoPago.classList.remove("oculto");
            campoObs.classList.remove("oculto");

            // Ocultar penalización
            campoPenalizacion.classList.add("oculto");

            // Restaurar required
            tipoPagoSelect.setAttribute("required", "true");
            comisionInput.setAttribute("required", "true");

            tipoPagoSelect.value = "";
        }
        else {
            // Fallback
            campoComision.classList.remove("oculto");
            campoTipoPago.classList.remove("oculto");
            campoPenalizacion.classList.add("oculto");
            tipoPagoSelect.setAttribute("required", "true");
            comisionInput.setAttribute("required", "true");
        }
    }


    const token = localStorage.getItem("accessToken");

    console.log("🧠 ID de cita detectado:", idCita);
    console.log("🎯 Modo detectado:", modo || "registro");

    if (!token) {
        alert("No se encontró el token. Inicia sesión nuevamente.");
        window.location.href = "/login.html";
        return;
    }

    // Mostrar el modal solo si vienes con una cita (modo registro)
    if (idCita) {

        if (modo === "penalizacion") {
            form.montoTotal.value = 200; // o el monto que definas
            form.motivo.value = "Penalización por inasistencia";
            form.penalizacion.value = 200;
            form.penalizacion.disabled = false; // visible para revisión
        } else if (modo !== "ver") {
            form.montoTotal.value = 500;
            form.motivo.value = "Cita atendida";
        }
        ajustarCamposSegunModo(form, modo);
        modal.style.display = "block";

    } else {
        // En modo ver o al abrir pagos.html sin parámetros, ocultamos todo
        modal.style.display = "none";
        form.style.display = "none";
    }


    // Botón cancelar
    btnCancelar.addEventListener("click", () => {
        modal.style.display = "none";
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const datos = Object.fromEntries(new FormData(form).entries());
        datos.citaId = parseInt(idCita);
        datos.penalizacion = parseFloat(datos.penalizacion || 0);
        datos.comisionClinica = 0;
        if (modo === "penalizacion") {
            datos.tipoPago = "PENALIZACION"; // ⚙️ enum válido
        } else {
            datos.tipoPago = form.tipoPago.value;
        }

        try {
            // 1️⃣ Registrar pago
            const resp = await fetch("http://localhost:8082/pagos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token,
                },
                body: JSON.stringify(datos),
            });

            if (!resp.ok) {
                const error = await resp.text();
                alert("Error al registrar pago: " + error);
                return;
            }

            // 2️⃣ Manejo de estado según el modo
            // 2️⃣ Manejo de estado según el modo
            let nuevoEstado;
            let mensaje;

            if (modo === "penalizacion") {
                nuevoEstado = "NO_ASISTIO";
                mensaje = "⚠️ Penalización registrada correctamente por inasistencia.";

                // ✅ Aquí SÍ actualizamos el estado después de registrar la penalización
                await fetch(
                    `http://localhost:8082/secretaria/citas/${idCita}/estado?estado=${nuevoEstado}`,
                    {
                        method: "PUT",
                        headers: { Authorization: "Bearer " + token },
                    }
                );

            } else {
                nuevoEstado = "ATENDIDA";
                mensaje = "✅ Pago registrado correctamente y cita marcada como atendida.";

                // ✅ Mantener el flujo normal
                await fetch(
                    `http://localhost:8082/secretaria/citas/${idCita}/estado?estado=${nuevoEstado}`,
                    {
                        method: "PUT",
                        headers: { Authorization: "Bearer " + token },
                    }
                );
            }


            alert(mensaje);
            await cargarPagos(true);
            modal.style.display = "none";
        } catch (err) {
            console.error("🚨 Error al conectar con el servidor:", err);
        }
    });



    // 🔁 Cargar pagos
    async function cargarPagos(verTodos = false) {
        try {
            const url = verTodos
                ? "http://localhost:8082/pagos"
                : `http://localhost:8082/pagos/cita/${idCita}`;



            console.log("📡 Cargando pagos desde:", url);

            const resp = await fetch(url, {
                headers: {
                    Authorization: "Bearer " + token,
                },
            });

            if (resp.status === 403) {
                alert("⚠️ No tienes permisos para ver estos pagos.");
                return;
            }

            if (!resp.ok) {
                console.error("Error HTTP:", resp.status);
                return;
            }

            const pagos = await resp.json();
            console.log("📦 Datos de pagos recibidos:", pagos);

            if (!pagos || pagos.length === 0) {
                listaPagos.innerHTML = `
            <h3>Pagos registrados</h3>
            <p>No hay pagos registrados para esta cita.</p>
            `;
                return;
            }

            listaPagos.innerHTML = `
            <h3>Pagos registrados</h3>
            <table border="1">
            <thead>
                <tr>
                <th>Paciente</th>
                <th>Psicólogo</th>
                <th>Monto</th>
                <th>Penalización</th>
                <th>Fecha y Hora</th>
                <th>Motivo</th>
                <th>Tipo de Pago</th>
                <th>Observaciones</th>
                </tr>
            </thead>
            <tbody>
                ${pagos
                    .map(
                        (p) => `
                <tr>
                    <td>${p.nombrePaciente || "-"}</td>
                    <td>${p.nombrePsicologo || "-"}</td>
                    <td>$${p.montoTotal}</td>
                    <td>${p.penalizacion ? `$${p.penalizacion}` : "-"}</td>
                    <td>${p.fechaCita || ""} ${p.horaCita || ""}</td>
                    <td>${p.motivo || "-"}</td>
                    <td>${p.tipoPago}</td>
                    <td>${p.observaciones || "-"}</td>
                </tr>
                `
                    )
                    .join("")}
            </tbody>
            </table>
        `;
        } catch (err) {
            console.error("Error al cargar pagos:", err);
        }
    }

    // 🔹 Carga inicial según modo
    if (modo === "ver") {
        await cargarPagos(false); // solo pagos de esa cita
    } else {
        await cargarPagos(true); // todos los pagos
    }
});
