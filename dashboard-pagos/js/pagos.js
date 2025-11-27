window._pagos = [];          // Todos los pagos cargados
window._pagosFiltrados = []; // Pagos filtrados
let paginaActual = 1;
const pagosPorPagina = 10;

document.addEventListener("DOMContentLoaded", async () => {
    // =======================
    // 🧩 ELEMENTOS DOM
    // =======================
    const modal = document.getElementById("modalPago");
    const form = document.getElementById("formPago");
    const listaPagos = document.getElementById("listaPagos");
    const btnCancelar = document.getElementById("btnCancelar");
    const filtroPaciente = document.getElementById("filtroPacientePago");
    const filtroPsicologo = document.getElementById("filtroPsicologoPago");

    // Modal de reporte
    const modalFormato = document.getElementById("modalFormato");
    const btnReporte = document.getElementById("btnReportePagos");
    const btnPdf = document.getElementById("btnPdf");
    const btnExcel = document.getElementById("btnExcel");
    const btnCerrarModal = document.getElementById("btnCerrarModal");

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
    // 📝 Funciones auxiliares
    // =======================
    const formatearTexto = (texto) => {
        if (!texto) return "-";
        return texto.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    const normalizarHora = (h) => h ? h.substring(0, 5) : "";

    const obtenerPagosPagina = (pagos, pagina, porPagina) => {
        const inicio = (pagina - 1) * porPagina;
        return pagos.slice(inicio, inicio + porPagina);
    };

    const actualizarTotal = (pagos) => {
        const pagosAtendidos = pagos.filter(p => p.tipoPago !== "PENALIZACION");
        const totalPagos = pagosAtendidos.reduce((acc, p) => acc + (p.montoTotal || 0), 0);
        const totalComisiones = pagosAtendidos.reduce((acc, p) => acc + (p.comisionClinica || 0), 0);
        const totalPsicologo = totalPagos - totalComisiones;

        document.getElementById("totalPagos").textContent = "Total: $" + totalPagos.toFixed(2);
        document.getElementById("totalComisiones").textContent = "Total comisiones: $" + totalComisiones.toFixed(2);
        document.getElementById("totalPsicologo").textContent = "Total para psicólogo: $" + totalPsicologo.toFixed(2);
    };

    // =======================
    // 🔄 Cargar filtros iniciales
    // =======================
    const cargarFiltrosIniciales = async () => {
        const [psicologosResp, pacientesResp] = await Promise.all([
            fetch(`${CONFIG.API_BASE_URL}/secretaria/psicologos`, { headers: { Authorization: "Bearer " + token } }),
            fetch(`${CONFIG.API_BASE_URL}/secretaria/pacientes`, { headers: { Authorization: "Bearer " + token } })
        ]);

        const psicologos = await psicologosResp.json();
        const pacientes = await pacientesResp.json();

        filtroPsicologo.innerHTML = `<option value="">Todos</option>` +
            psicologos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join("");

        filtroPaciente.innerHTML = `<option value="">Todos</option>` +
            pacientes.map(p => `<option value="${p.clave}">${p.nombre}</option>`).join("");
    };

    await cargarFiltrosIniciales();

    // =======================
    // 🎨 Ajuste de Campos según modo
    // =======================
    const ajustarCamposSegunModo = () => {
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
    };

    // =======================
    // 📊 Renderizar tabla y paginación
    // =======================
    const renderTablaPagos = (pagos) => {
        listaPagos.innerHTML = "";
        if (!pagos || pagos.length === 0) {
            listaPagos.innerHTML = "<p>No se encontraron resultados.</p>";
            actualizarTotal([]);
            renderPaginacion(0);
            return;
        }

        const paginaDatos = obtenerPagosPagina(pagos, paginaActual, pagosPorPagina);

        const tabla = document.createElement("table");
        tabla.classList.add("styled-table");
        tabla.innerHTML = `
            <thead>
                <tr>
                    <th>Paciente</th>
                    <th>Psicólogo</th>
                    <th>Monto</th>
                    <th>Penalización</th>
                    <th>Comision</th>
                    <th>Fecha y Hora</th>
                    <th>Motivo</th>
                    <th>Tipo de Pago</th>
                    <th>Observación</th>
                </tr>
            </thead>
            <tbody>
                ${paginaDatos.map(p => `
                    <tr>
                        <td>${p.nombrePaciente || "-"}</td>
                        <td>${p.nombrePsicologo || "-"}</td>
                        <td>$${p.montoTotal || "-"}</td>
                        <td>${p.penalizacion ? "$" + p.penalizacion : "-"}</td>
                        <td>${p.comisionClinica ? "$" + p.comisionClinica : "-"}</td>
                        <td>${p.fechaCita || ""} ${p.horaCita || ""}</td>
                        <td>${p.motivo || "-"}</td>
                        <td>${formatearTexto(p.tipoPago)}</td>
                        <td>${p.observaciones || "-"}</td>
                    </tr>
                `).join("")}
            </tbody>
        `;
        listaPagos.appendChild(tabla);
        actualizarTotal(pagos);
        renderPaginacion(pagos.length);
    };

    const renderPaginacion = (totalPagos) => {
        const contenedor = document.getElementById("paginacionPagos");
        contenedor.innerHTML = "";

        const totalPaginas = Math.ceil(totalPagos / pagosPorPagina);
        if (totalPaginas <= 1) return;

        // Botón anterior
        const btnPrev = document.createElement("button");
        btnPrev.textContent = "Anterior";
        btnPrev.disabled = paginaActual === 1;
        btnPrev.addEventListener("click", () => {
            paginaActual--;
            renderTablaPagos(window._pagosFiltrados);
        });
        contenedor.appendChild(btnPrev);

        // Números
        for (let i = 1; i <= totalPaginas; i++) {
            const btn = document.createElement("button");
            btn.textContent = i;
            if (i === paginaActual) btn.classList.add("active-page");
            btn.addEventListener("click", () => {
                paginaActual = i;
                renderTablaPagos(window._pagosFiltrados);
            });
            contenedor.appendChild(btn);
        }

        // Botón siguiente
        const btnNext = document.createElement("button");
        btnNext.textContent = "Siguiente";
        btnNext.disabled = paginaActual === totalPaginas;
        btnNext.addEventListener("click", () => {
            paginaActual++;
            renderTablaPagos(window._pagosFiltrados);
        });
        contenedor.appendChild(btnNext);
    };

    // =======================
    // 🔄 Cargar pagos
    // =======================
    const cargarPagos = async (verTodos = false) => {
        const url = verTodos
            ? `${CONFIG.API_BASE_URL}/pagos`
            : `${CONFIG.API_BASE_URL}/pagos/cita/${idCita}`;

        const resp = await fetch(url, { headers: { Authorization: "Bearer " + token } });
        const datos = await resp.json();

        // Siempre actualizar filtrados
        window._pagos = datos;
        window._pagosFiltrados = [...datos];
        paginaActual = 1;

        renderTablaPagos(window._pagosFiltrados);
    };

    // =======================
    // 🔎 Aplicar filtros
    // =======================
    const aplicarFiltrosPagos = () => {
        const paciente = filtroPaciente.value;
        const psicologo = filtroPsicologo.value;
        const fecha = document.getElementById("filtroFechaPago").value;
        const hora = document.getElementById("filtroHoraPago").value;
        const tipoPago = document.getElementById("filtroTipoPago").value;
        const tienePenalizacion = document.getElementById("filtroPenalizacion").value;
        const motivo = document.getElementById("filtroMotivo").value;

        const filtrados = window._pagos.filter(p => (
            (!paciente || p.pacienteId == paciente) &&
            (!psicologo || p.psicologoId == psicologo) &&
            (!fecha || p.fechaCita === fecha) &&
            (!hora || normalizarHora(p.horaCita) === hora) &&
            (!tipoPago || p.tipoPago === tipoPago) &&
            (!motivo || p.motivo === motivo) &&
            (tienePenalizacion === "" || (tienePenalizacion === "true") === Boolean(p.penalizacion))
        ));

        window._pagosFiltrados = filtrados;
        paginaActual = 1;
        renderTablaPagos(filtrados);
    };

    const filtros = [
        filtroPaciente,
        filtroPsicologo,
        document.getElementById("filtroFechaPago"),
        document.getElementById("filtroHoraPago"),
        document.getElementById("filtroTipoPago"),
        document.getElementById("filtroPenalizacion"),
        document.getElementById("filtroMotivo")
    ];
    filtros.forEach(f => f.addEventListener("change", aplicarFiltrosPagos));

    document.getElementById("btnRestablecerPagos").addEventListener("click", () => {
        filtros.forEach(f => f.value = "");
        window._pagosFiltrados = [...window._pagos];
        paginaActual = 1;
        renderTablaPagos(window._pagosFiltrados);
    });

    // =======================
    // Botón cancelar modal
    // =======================
btnCancelar.addEventListener("click", () => {
    modal.style.display = "none";
    window.history.back(); // vuelve a la página anterior
});

    // =======================
    // Registro de pagos
    // =======================
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const datos = Object.fromEntries(new FormData(form).entries());
        datos.citaId = parseInt(idCita);
        datos.penalizacion = parseFloat(datos.penalizacion || 0);
        datos.comisionClinica = parseFloat(datos.comisionClinica || 0);

        if (modo === "penalizacion") {
            datos.tipoPago = "PENALIZACION";
        } else {
            if (!form.tipoPago.value) {
                alert("Selecciona el tipo de pago.");
                return;
            }
            datos.tipoPago = form.tipoPago.value;
        }

        if (!datos.montoTotal || parseFloat(datos.montoTotal) <= 0) {
            alert("Ingresa un monto válido.");
            return;
        }

        const resp = await fetch(`${CONFIG.API_BASE_URL}/pagos`, {
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
        await fetch(`${CONFIG.API_BASE_URL}/secretaria/citas/${idCita}/estado?estado=${nuevoEstado}`, {
            method: "PUT",
            headers: { Authorization: "Bearer " + token }
        });

        Swal.fire({
            icon: modo === "penalizacion" ? 'warning' : 'success',
            title: modo === "penalizacion" ? 'Penalización registrada' : 'Pago registrado',
            text: modo === "penalizacion"
                ? 'Se registró la penalización del paciente.'
                : 'El pago de la cita se registró correctamente.',
            confirmButtonText: 'Aceptar'
        });

        await cargarPagos(true);
        modal.style.display = "none";
    });

    // =======================
    // Abrir modal de registro solo si no es modo "ver"
    // =======================
    if (idCita && modo !== "ver") {
        ajustarCamposSegunModo();
        const respCita = await fetch(`${CONFIG.API_BASE_URL}/secretaria/citas/${idCita}`, { headers: { Authorization: "Bearer " + token } });
        const cita = await respCita.json();
        const pacienteId = cita.pacienteId;

        const respPen = await fetch(`${CONFIG.API_BASE_URL}/pagos/penalizaciones/${pacienteId}`, { headers: { Authorization: "Bearer " + token } });
        const penalizaciones = await respPen.json();

        const divPen = document.getElementById("penalizacionesPendientes");
        divPen.innerHTML = "";
        if (penalizaciones.length > 0) {
            divPen.style.display = "block";
            penalizaciones.forEach(p => {
                const div = document.createElement("div");
                div.className = "pen-item";
                div.style.marginBottom = "5px";
                div.textContent = `🔴 Penalización pendiente: $${p.penalizacion}`;
                divPen.appendChild(div);
            });
        } else {
            divPen.style.display = "none";
        }

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
        form.style.display = "none";
        await cargarPagos(true);
    }

    // =======================
    // Modal de reporte
    // =======================
    btnReporte.addEventListener("click", () => modalFormato.classList.remove("oculto"));
    btnCerrarModal.addEventListener("click", () => modalFormato.classList.add("oculto"));
    window.addEventListener("click", (e) => { if (e.target === modalFormato) modalFormato.classList.add("oculto"); });

    btnPdf.addEventListener("click", () => {
        generarReportePagosPDF(window._pagosFiltrados);
        modalFormato.classList.add("oculto");
    });

    btnExcel.addEventListener("click", () => {
        generarReportePagosExcel(window._pagosFiltrados);
        modalFormato.classList.add("oculto");
    });

});
