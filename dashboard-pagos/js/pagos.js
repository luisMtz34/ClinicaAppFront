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
    let paginaActual = 1;
    const pagosPorPagina = 10;

    function obtenerPagosPagina(pagos, pagina, porPagina) {
        const inicio = (pagina - 1) * porPagina;
        return pagos.slice(inicio, inicio + porPagina);
    }



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

    function normalizarHora(h) { return h ? h.substring(0, 5) : ""; }

    // =======================
    // 🔄 Cargar filtros iniciales
    // =======================
    async function cargarFiltrosIniciales() {
        const [psicologosResp, pacientesResp] = await Promise.all([
            fetch(`${CONFIG.API_BASE_URL}/secretaria/psicologos`, {
                headers: { Authorization: "Bearer " + token }
            }),
            fetch(`${CONFIG.API_BASE_URL}/secretaria/pacientes`, {
                headers: { Authorization: "Bearer " + token }
            })
        ]);

        const psicologos = await psicologosResp.json();
        const pacientes = await pacientesResp.json();

        filtroPsicologo.innerHTML = `<option value="">Todos</option>` +
            psicologos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join("");

        filtroPaciente.innerHTML = `<option value="">Todos</option>` +
            pacientes.map(p => `<option value="${p.clave}">${p.nombre}</option>`).join("");
    }

    await cargarFiltrosIniciales();

    function actualizarTotal(pagos) {
        // Filtrar solo pagos de citas atendidas (ignorar penalizaciones)
        const pagosAtendidos = pagos.filter(p => p.tipoPago !== "PENALIZACION");

        const totalPagos = pagosAtendidos.reduce((acc, p) => acc + (p.montoTotal || 0), 0);
        const totalComisiones = pagosAtendidos.reduce((acc, p) => acc + (p.comisionClinica || 0), 0);
        const totalPsicologo = totalPagos - totalComisiones;

        document.getElementById("totalPagos").textContent =
            "Total: $" + totalPagos.toFixed(2);

        document.getElementById("totalComisiones").textContent =
            "Total comisiones: $" + totalComisiones.toFixed(2);

        document.getElementById("totalPsicologo").textContent =
            "Total para psicólogo: $" + totalPsicologo.toFixed(2);
    }



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

        // =====================
        // 🔎 Cargar datos de la cita y penalizaciones del paciente
        // =====================

        // 1. Obtener datos de la cita
        const respCita = await fetch(`${CONFIG.API_BASE_URL}/secretaria/citas/${idCita}`, {
            headers: { Authorization: "Bearer " + token }
        });

        const cita = await respCita.json();
        console.log(cita);

        // 2. Obtener ID del paciente
        const pacienteId = cita.pacienteId; // ✅ correcto

        // 3. Consultar penalizaciones pendientes
        const respPen = await fetch(`${CONFIG.API_BASE_URL}/pagos/penalizaciones/${pacienteId}`, {
            headers: { Authorization: "Bearer " + token }
        });

        const penalizaciones = await respPen.json();

        // 4. Mostrar penalizaciones en el modal
        const divPen = document.getElementById("penalizacionesPendientes");
        divPen.innerHTML = "";

        if (penalizaciones.length > 0) {
            divPen.style.display = "block";
            penalizaciones.forEach(p => {
                divPen.innerHTML += `
            <div class="pen-item" style="margin-bottom:5px;">
                🔴 Penalización pendiente: $${p.penalizacion}
            </div>
        `;
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
        datos.comisionClinica = parseFloat(datos.comisionClinica || 0);

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

        await fetch(
            `${CONFIG.API_BASE_URL}/secretaria/citas/${idCita}/estado?estado=${nuevoEstado}`,
            { method: "PUT", headers: { Authorization: "Bearer " + token } }
        );

        if (modo === "penalizacion") {
            await Swal.fire({
                icon: 'warning',
                title: 'Penalización registrada',
                text: 'Se registró la penalización del paciente.',
                confirmButtonText: 'Aceptar'
            });
        } else {
            await Swal.fire({
                icon: 'success',
                title: 'Pago registrado',
                text: 'El pago de la cita se registró correctamente.',
                confirmButtonText: 'Aceptar'
            });
        }



        await cargarPagos(true);
        modal.style.display = "none";
    });

    // =======================
    // 📊 Renderizar tabla de pagos
    // =======================
    function renderTablaPagos(pagos) {
        const cont = listaPagos;

        if (!pagos || pagos.length === 0) {
            cont.innerHTML = "<p>No se encontraron resultados.</p>";
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

        cont.innerHTML = "";
        cont.appendChild(tabla);

        actualizarTotal(pagos);
        renderPaginacion(pagos.length);
    }


    function renderPaginacion(totalPagos) {
        const contenedor = document.getElementById("paginacionPagos");
        contenedor.innerHTML = "";

        const totalPaginas = Math.ceil(totalPagos / pagosPorPagina);

        if (totalPaginas <= 1) return; // No dibujar paginación si no es necesaria

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
    }


    // =======================
    // 🔄 Cargar pagos
    // =======================
    async function cargarPagos(verTodos = false) {
        const url = verTodos
            ? `${CONFIG.API_BASE_URL}/pagos`
            : `${CONFIG.API_BASE_URL}/pagos/cita/${idCita}`;


        const resp = await fetch(url, { headers: { Authorization: "Bearer " + token } });
        const datos = await resp.json();

        if (verTodos) {
            window._pagos = datos;
            window._pagosFiltrados = datos;
            paginaActual = 1;

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
        const motivo = document.getElementById("filtroMotivo").value;

        const filtrados = window._pagos.filter(p => {
            return (
                (!paciente || p.pacienteId == paciente) &&
                (!psicologo || p.psicologoId == psicologo) &&
                (!fecha || p.fechaCita === fecha) &&
                (!hora || normalizarHora(p.horaCita) === hora) &&
                (!tipoPago || p.tipoPago === tipoPago) &&
                (!motivo || p.motivo === motivo) &&

                (tienePenalizacion === "" || (tienePenalizacion === "true") === Boolean(p.penalizacion))
            );
        });

        window._pagosFiltrados = filtrados;
        paginaActual = 1;
        renderTablaPagos(filtrados);

    }

    // Filtros automáticos al cambiar cualquier select/input
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
    paginaActual = 1;


    // =======================
    // 🔄 Botón Restablecer filtros
    // =======================
    document.getElementById("btnRestablecerPagos").addEventListener("click", () => {
        filtros.forEach(f => f.value = "");
        window._pagosFiltrados = [...window._pagos];
        renderTablaPagos(window._pagos);
        paginaActual = 1;
        renderTablaPagos(window._pagos);

    });

    // ====================================
    // 📄 MODAL DE REPORTE (NUEVO DISEÑO)
    // ====================================
    const modalFormato = document.getElementById("modalFormato");
    const btnReporte = document.getElementById("btnReportePagos"); // ← CORREGIDO

    const btnPdf = document.getElementById("btnPdf");
    const btnExcel = document.getElementById("btnExcel");
    const btnCerrarModal = document.getElementById("btnCerrarModal");

    // Abrir modal
    btnReporte.addEventListener("click", () => {
        modalFormato.classList.remove("oculto");
    });

    // Cerrar modal
    btnCerrarModal.addEventListener("click", () => {
        modalFormato.classList.add("oculto");
    });

    // Exportar PDF
    btnPdf.addEventListener("click", () => {
        generarReportePagosPDF(window._pagosFiltrados);
        modalFormato.classList.add("oculto");
    });

    // Exportar Excel
    btnExcel.addEventListener("click", () => {
        generarReportePagosExcel(window._pagosFiltrados);
        modalFormato.classList.add("oculto");
    });

    // Cerrar modal haciendo clic fuera del contenido
    window.addEventListener("click", (e) => {
        if (e.target === modalFormato) {
            modalFormato.classList.add("oculto");
        }
    });
});


function generarReportePagosPDF(data) {
    if (!data || data.length === 0) {
        alert("No hay datos para generar el reporte.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Reporte de Pagos", 14, 15);

    const tabla = data.map(p => [
        p.nombrePaciente || "-",
        p.nombrePsicologo || "-",
        "$" + (p.montoTotal || 0),
        p.penalizacion ? "$" + p.penalizacion : "-",
        (p.fechaCita || "") + " " + (p.horaCita || ""),
        p.motivo || "-",
        p.tipoPago || "-",
        p.observaciones || "-"
    ]);

    doc.autoTable({
        head: [["Paciente", "Psicólogo", "Monto", "Penalización", "Comision", "Fecha", "Motivo", "Tipo", "Observaciones"]],
        body: tabla,
        startY: 20
    });

    doc.save("reporte_pagos.pdf");
}
function generarReportePagosExcel(data) {
    if (!data || data.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    const hoja = data.map(p => ({
        Paciente: p.nombrePaciente || "-",
        Psicólogo: p.nombrePsicologo || "-",
        Monto: p.montoTotal || 0,
        Penalización: p.penalizacion || 0,
        Fecha: p.fechaCita || "",
        Hora: p.horaCita || "",
        Motivo: p.motivo || "-",
        TipoPago: p.tipoPago || "-",
        Observaciones: p.observaciones || "-"
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(hoja);

    XLSX.utils.book_append_sheet(wb, ws, "Pagos");
    XLSX.writeFile(wb, "reporte_pagos.xlsx");
}
