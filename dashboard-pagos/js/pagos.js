window._pagos = [];          // Todos los pagos cargados
window._pagosFiltrados = []; // Pagos filtrados

document.addEventListener("DOMContentLoaded", async () => {
    // =======================
    // 🔐 TOKEN
    // =======================
    const token = localStorage.getItem("accessToken");
    if (!token) {
        alert("No se encontró el token. Inicia sesión nuevamente.");
        window.location.href = "/login.html";
        return;
    }

    // =======================
    // 🔗 PARÁMETROS URL
    // =======================
    const urlParams = new URLSearchParams(window.location.search);
    const idCita = urlParams.get("idCita");
    const modo = (urlParams.get("modo") || "registro").toLowerCase();

    // =======================
    // 🧩 ELEMENTOS DOM
    // =======================
    const modal = document.getElementById("modalPago");
    const form = document.getElementById("formPago");
    const listaPagos = document.getElementById("listaPagos");
    const btnCancelar = document.getElementById("btnCancelar");

    const filtroPaciente = document.getElementById("filtroPacientePago");
    const filtroPsicologo = document.getElementById("filtroPsicologoPago");

    // =======================
    // 📝 Formateo de texto
    // =======================
    function formatearTexto(texto) {
        if (!texto) return "-";
        return texto.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }

    function normalizarHora(h) { return h ? h.substring(0,5) : ""; }

    // =======================
    // 🔄 Cargar filtros iniciales
    // =======================
    async function cargarFiltrosIniciales() {
        const [psicologosResp, pacientesResp] = await Promise.all([
            fetch("http://localhost:8082/secretaria/psicologos", { headers: { Authorization: "Bearer " + token } }),
            fetch("http://localhost:8082/secretaria/pacientes", { headers: { Authorization: "Bearer " + token } })
        ]);

        const psicologos = await psicologosResp.json();
        const pacientes = await pacientesResp.json();

        filtroPsicologo.innerHTML = `<option value="">Todos</option>` +
            psicologos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join("");

        filtroPaciente.innerHTML = `<option value="">Todos</option>` +
            pacientes.map(p => `<option value="${p.clave}">${p.nombre}</option>`).join("");
    }

    await cargarFiltrosIniciales();

    // =======================
    // 🎨 Ajuste de Campos según modo
    // =======================
    function ajustarCamposSegunModo() {
        const campoComision = form.querySelector("[name='comisionClinica']").closest(".campo");
        const campoTipoPago = form.querySelector("[name='tipoPago']").closest(".campo");
        const campoPenalizacion = form.querySelector("[name='penalizacion']").closest(".campo");
        const campoMonto = form.querySelector("[name='montoTotal']").closest(".campo");
        const campoMotivo = form.querySelector("[name='motivo']").closest(".campo");
        const campoObs = form.querySelector("[name='observaciones']").closest(".campo");

        const tipoPagoSelect = form.querySelector("[name='tipoPago']");
        const comisionInput = form.querySelector("[name='comisionClinica']");

        if (modo === "penalizacion") {
            campoMonto.classList.remove("oculto");
            campoMotivo.classList.remove("oculto");
            campoObs.classList.remove("oculto");

            campoComision.classList.add("oculto");
            campoTipoPago.classList.add("oculto");
            campoPenalizacion.classList.remove("oculto");

            tipoPagoSelect.removeAttribute("required");
            comisionInput.removeAttribute("required");

            tipoPagoSelect.value = "PENALIZACION";
            comisionInput.value = 0;
        } else if (modo === "atendida") {
            campoMonto.classList.remove("oculto");
            campoComision.classList.remove("oculto");
            campoTipoPago.classList.remove("oculto");
            campoMotivo.classList.remove("oculto");
            campoObs.classList.remove("oculto");

            campoPenalizacion.classList.add("oculto");

            tipoPagoSelect.setAttribute("required", true);
            comisionInput.setAttribute("required", true);

            tipoPagoSelect.value = "";
        } else {
            campoComision.classList.remove("oculto");
            campoTipoPago.classList.remove("oculto");
            campoPenalizacion.classList.add("oculto");
        }
    }

    // =======================
    // 📌 Mostrar Modal según modo
    // =======================
    if (idCita && modo !== "ver") {
        ajustarCamposSegunModo();

        if (modo === "penalizacion") {
            form.montoTotal.value = 200;
            form.motivo.value = "Penalización por inasistencia";
            form.penalizacion.value = 200;
        } else {
            form.montoTotal.value = 500;
            form.motivo.value = "Cita atendida";
        }

        modal.style.display = "flex";
    } else {
        modal.style.display = "none";
        form.style.display = modo === "ver" ? "none" : "block";
    }

    // =======================
    // ❌ Botón cancelar modal
    // =======================
    btnCancelar.addEventListener("click", () => modal.style.display = "none");

    // =======================
    // 💾 Registrar Pago
    // =======================
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const datos = Object.fromEntries(new FormData(form).entries());
        datos.citaId = parseInt(idCita);
        datos.penalizacion = parseFloat(datos.penalizacion || 0);

        if (modo === "penalizacion") {
            datos.tipoPago = "PENALIZACION";
        } else {
            if (!form.tipoPago.value) {
                alert("Selecciona el tipo de pago.");
                return;
            }
            datos.tipoPago = form.tipoPago.value;
        }
        datos.comisionClinica = 0;

        const resp = await fetch("http://localhost:8082/pagos", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify(datos)
        });

        if (!resp.ok) {
            alert("Error al registrar pago.");
            return;
        }

        // Cambiar estado de cita
        const nuevoEstado = (modo === "penalizacion") ? "NO_ASISTIO" : "ATENDIDA";

        await fetch(
            `http://localhost:8082/secretaria/citas/${idCita}/estado?estado=${nuevoEstado}`,
            { method: "PUT", headers: { Authorization: "Bearer " + token } }
        );

        alert(
            modo === "penalizacion"
                ? "⚠️ Penalización registrada."
                : "✅ Pago registrado correctamente."
        );

        await cargarPagos(true);
        modal.style.display = "none";
    });

    // =======================
    // 📊 Renderizar tabla de pagos
    // =======================
    function renderTablaPagos(pagos) {
        const contenedor = listaPagos;
        if (!pagos || pagos.length === 0) {
            contenedor.innerHTML = "<p>No se encontraron resultados.</p>";
            return;
        }

        const tabla = document.createElement("table");
        tabla.classList.add("styled-table");

        tabla.innerHTML = `
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
                ${pagos.map(p => `
                    <tr>
                        <td>${p.nombrePaciente || "-"}</td>
                        <td>${p.nombrePsicologo || "-"}</td>
                        <td>$${p.montoTotal || "-"}</td>
                        <td>${p.penalizacion ? "$" + p.penalizacion : "-"}</td>
                        <td>${p.fechaCita || ""} ${p.horaCita || ""}</td>
                        <td>${p.motivo || "-"}</td>
                        <td>${formatearTexto(p.tipoPago)}</td>
                        <td>${p.observaciones || "-"}</td>
                    </tr>
                `).join("")}
            </tbody>
        `;

        contenedor.innerHTML = "";
        contenedor.appendChild(tabla);
    }

    // =======================
    // 🔄 Cargar pagos
    // =======================
    async function cargarPagos(verTodos = false) {
        const url = verTodos
            ? "http://localhost:8082/pagos"
            : `http://localhost:8082/pagos/cita/${idCita}`;

        const resp = await fetch(url, { headers: { Authorization: "Bearer " + token } });
        const datos = await resp.json();

        if (verTodos) {
            window._pagos = datos;
            window._pagosFiltrados = datos;
        }

        renderTablaPagos(datos);
    }

    // Carga inicial
    cargarPagos(modo !== "ver");

    // =======================
    // 🔎 Filtros automáticos
    // =======================
    function aplicarFiltrosPagos() {
        const paciente = filtroPaciente.value;
        const psicologo = filtroPsicologo.value;
        const fecha = document.getElementById("filtroFechaPago").value;
        const hora = document.getElementById("filtroHoraPago").value;
        const tipoPago = document.getElementById("filtroTipoPago").value;
        const tienePenalizacion = document.getElementById("filtroPenalizacion").value;

        const filtrados = window._pagos.filter(p => {
            return (
                (!paciente || p.pacienteId == paciente) &&
                (!psicologo || p.psicologoId == psicologo) &&
                (!fecha || p.fechaCita === fecha) &&
                (!hora || normalizarHora(p.horaCita) === hora) &&
                (!tipoPago || p.tipoPago === tipoPago) &&
                (tienePenalizacion === "" || (tienePenalizacion === "true") === Boolean(p.penalizacion))
            );
        });

        window._pagosFiltrados = filtrados;
        renderTablaPagos(filtrados);
    }

    // Filtros automáticos al cambiar cualquier select/input
    const filtros = [
        filtroPaciente,
        filtroPsicologo,
        document.getElementById("filtroFechaPago"),
        document.getElementById("filtroHoraPago"),
        document.getElementById("filtroTipoPago"),
        document.getElementById("filtroPenalizacion")
    ];
    filtros.forEach(f => f.addEventListener("change", aplicarFiltrosPagos));

    // =======================
    // 🔄 Botón Restablecer filtros
    // =======================
    document.getElementById("btnRestablecerPagos").addEventListener("click", () => {
        filtros.forEach(f => f.value = "");
        window._pagosFiltrados = [...window._pagos];
        renderTablaPagos(window._pagos);
    });
});
