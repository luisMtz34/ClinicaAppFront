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
    // 📝 Funciones auxiliares (declaradas como funciones para evitar hoisting issues)
    // =======================
    function formatearTexto(texto) {
        if (!texto) return "-";
        return texto.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }

    function normalizarHora(h) {
        return h ? h.substring(0, 5) : "";
    }

    function obtenerPagosPagina(pagos, pagina, porPagina = pagosPorPagina) {
        const inicio = (pagina - 1) * porPagina;
        return pagos.slice(inicio, inicio + porPagina);
    }

    function actualizarTotal(pagos) {
        const pagosAtendidos = pagos.filter(p => p.tipoPago !== "PENALIZACION");
        const totalPagos = pagosAtendidos.reduce((acc, p) => acc + (p.montoTotal || 0), 0);
        const totalComisiones = pagosAtendidos.reduce((acc, p) => acc + (p.comisionClinica || 0), 0);
        const totalPsicologo = totalPagos - totalComisiones;

        const elTotal = document.getElementById("totalPagos");
        const elComisiones = document.getElementById("totalComisiones");
        const elPsicologo = document.getElementById("totalPsicologo");

        if (elTotal) elTotal.textContent = "Total: $" + totalPagos.toFixed(2);
        if (elComisiones) elComisiones.textContent = "Total comisiones: $" + totalComisiones.toFixed(2);
        if (elPsicologo) elPsicologo.textContent = "Total para psicólogo: $" + totalPsicologo.toFixed(2);
    }

    function renderPaginacion(totalPagos) {
        const contenedor = document.getElementById("paginacionPagos");
        if (!contenedor) return;
        contenedor.innerHTML = "";

        const totalPaginas = Math.ceil(totalPagos / pagosPorPagina);
        if (totalPaginas <= 1) return;

        // Botón anterior
        const btnPrev = document.createElement("button");
        btnPrev.textContent = "Anterior";
        btnPrev.disabled = paginaActual === 1;
        btnPrev.addEventListener("click", () => {
            if (paginaActual > 1) paginaActual--;
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
            if (paginaActual < totalPaginas) paginaActual++;
            renderTablaPagos(window._pagosFiltrados);
        });
        contenedor.appendChild(btnNext);
    }

    function renderTablaPagos(pagos) {
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
                        <td>${p.montoTotal != null ? "$" + p.montoTotal : "-"}</td>
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
    }

    // =======================
    // 🔄 Cargar filtros iniciales
    // =======================
    async function cargarFiltrosIniciales() {
        try {
            const [psicologosResp, pacientesResp] = await Promise.all([
                fetch(`${CONFIG.API_BASE_URL}/secretaria/psicologos`, { headers: { Authorization: "Bearer " + token } }),
                fetch(`${CONFIG.API_BASE_URL}/secretaria/pacientes`, { headers: { Authorization: "Bearer " + token } })
            ]);

            const psicologos = await psicologosResp.json();
            const pacientes = await pacientesResp.json();

            if (filtroPsicologo) {
                filtroPsicologo.innerHTML = `<option value="">Todos</option>` +
                    psicologos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join("");
            }

            if (filtroPaciente) {
                filtroPaciente.innerHTML = `<option value="">Todos</option>` +
                    pacientes.map(p => `<option value="${p.clave}">${p.nombre}</option>`).join("");
            }
        } catch (err) {
            console.error("Error cargando filtros iniciales:", err);
        }
    }

    // =======================
    // 🔄 Cargar pagos
    // =======================
    async function cargarPagos(verTodos = false) {
        try {
            // Si el llamador pide verTodos o no hay idCita, usar el endpoint /pagos
            const url = verTodos || !idCita
                ? `${CONFIG.API_BASE_URL}/pagos`
                : `${CONFIG.API_BASE_URL}/pagos/cita/${idCita}`;

            const resp = await fetch(url, { headers: { Authorization: "Bearer " + token } });
            const datos = await resp.json();

            // Asegurarnos de trabajar con arrays
            const datosArray = Array.isArray(datos) ? datos : (datos ? [datos] : []);

            // Siempre actualizar filtrados
            window._pagos = datosArray;
            window._pagosFiltrados = [...datosArray];
            paginaActual = 1;

            renderTablaPagos(window._pagosFiltrados);
        } catch (err) {
            console.error("Error cargando pagos:", err);
            listaPagos.innerHTML = "<p>Error cargando pagos. Revisa la consola.</p>";
            actualizarTotal([]);
            renderPaginacion(0);
        }
    }

    // =======================
    // 🔎 Aplicar filtros
    // =======================
    function aplicarFiltrosPagos() {
        const paciente = filtroPaciente ? filtroPaciente.value : "";
        const psicologo = filtroPsicologo ? filtroPsicologo.value : "";
        const fecha = document.getElementById("filtroFechaPago") ? document.getElementById("filtroFechaPago").value : "";
        const hora = document.getElementById("filtroHoraPago") ? document.getElementById("filtroHoraPago").value : "";
        const tipoPago = document.getElementById("filtroTipoPago") ? document.getElementById("filtroTipoPago").value : "";
        const tienePenalizacion = document.getElementById("filtroPenalizacion") ? document.getElementById("filtroPenalizacion").value : "";
        const motivo = document.getElementById("filtroMotivo") ? document.getElementById("filtroMotivo").value : "";

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
    }

    // =======================
    // 🎨 Ajuste de Campos según modo
    // =======================
    function ajustarCamposSegunModo() {
        const campoComision = form.querySelector("[name='comisionClinica']")?.closest(".campo");
        const campoTipoPago = form.querySelector("[name='tipoPago']")?.closest(".campo");
        const campoPenalizacion = form.querySelector("[name='penalizacion']")?.closest(".campo");
        const campoMonto = form.querySelector("[name='montoTotal']")?.closest(".campo");
        const campoMotivo = form.querySelector("[name='motivo']")?.closest(".campo");
        const campoObs = form.querySelector("[name='observaciones']")?.closest(".campo");

        const tipoPagoSelect = form.querySelector("[name='tipoPago']");
        const comisionInput = form.querySelector("[name='comisionClinica']");

        if (!tipoPagoSelect || !comisionInput) return;

        if (modo === "penalizacion") {
            campoMonto?.classList.remove("oculto");
            campoMotivo?.classList.remove("oculto");
            campoObs?.classList.remove("oculto");
            campoComision?.classList.add("oculto");
            campoTipoPago?.classList.add("oculto");
            campoPenalizacion?.classList.remove("oculto");
            tipoPagoSelect.removeAttribute("required");
            comisionInput.removeAttribute("required");
            tipoPagoSelect.value = "PENALIZACION";
            comisionInput.value = 0;
        } else if (modo === "atendida") {
            campoMonto?.classList.remove("oculto");
            campoComision?.classList.remove("oculto");
            campoTipoPago?.classList.remove("oculto");
            campoMotivo?.classList.remove("oculto");
            campoObs?.classList.remove("oculto");
            campoPenalizacion?.classList.add("oculto");
            tipoPagoSelect.setAttribute("required", true);
            comisionInput.setAttribute("required", true);
            tipoPagoSelect.value = "";
        } else {
            campoComision?.classList.remove("oculto");
            campoTipoPago?.classList.remove("oculto");
            campoPenalizacion?.classList.add("oculto");
        }
    }

    // =======================
    // Inicialización: cargar filtros primero (necesario para los selects)
    // =======================
    await cargarFiltrosIniciales();

    // =======================
    // Si venimos con idCita y modo=ver: mostrar solo ese(ese) pago(s) y detener inicialización adicional
    // =======================
    if (idCita && modo === "ver") {
        try {
            const resp = await fetch(`${CONFIG.API_BASE_URL}/pagos/cita/${idCita}`, {
                headers: { Authorization: "Bearer " + token }
            });

            const datos = await resp.json();
            const datosArray = Array.isArray(datos) ? datos : (datos ? [datos] : []);

            // Asegurarnos de setear arrays
            window._pagos = datosArray;
            window._pagosFiltrados = [...datosArray];
            paginaActual = 1;

            renderTablaPagos(window._pagosFiltrados);

            // Ocultar filtros porque solo es 1 pago (si existe el contenedor)
            const filtrosCont = document.querySelector(".filtros-container");
            if (filtrosCont) filtrosCont.style.display = "none";

            // Detenemos aquí la inicialización adicional para evitar que se carguen todos los pagos
            return;
        } catch (e) {
            console.error("Error cargando pago por cita", e);
            // No retornamos para permitir continuar con la carga normal si hubo error
        }
    }

    // =======================
    // Vincular filtros y botones
    // =======================
    const filtros = [
        filtroPaciente,
        filtroPsicologo,
        document.getElementById("filtroFechaPago"),
        document.getElementById("filtroHoraPago"),
        document.getElementById("filtroTipoPago"),
        document.getElementById("filtroPenalizacion"),
        document.getElementById("filtroMotivo")
    ].filter(Boolean);
    filtros.forEach(f => f.addEventListener("change", aplicarFiltrosPagos));

    const btnRest = document.getElementById("btnRestablecerPagos");
    if (btnRest) {
        btnRest.addEventListener("click", () => {
            filtros.forEach(f => f.value = "");
            window._pagosFiltrados = [...window._pagos];
            paginaActual = 1;
            renderTablaPagos(window._pagosFiltrados);
        });
    }

    // =======================
    // Botón cancelar modal
    // =======================
    if (btnCancelar) {
        btnCancelar.addEventListener("click", () => {
            modal.style.display = "none";
            window.history.back(); // vuelve a la página anterior
        });
    }

    // =======================
    // Registro de pagos
    // =======================
    if (form) {
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
    }

    // =======================
    // Abrir modal de registro solo si no es modo "ver"
    // =======================
    if (idCita && modo !== "ver") {
        ajustarCamposSegunModo();
        try {
            const respCita = await fetch(`${CONFIG.API_BASE_URL}/secretaria/citas/${idCita}`, { headers: { Authorization: "Bearer " + token } });
            const cita = await respCita.json();
            const pacienteId = cita.pacienteId;

            const respPen = await fetch(`${CONFIG.API_BASE_URL}/pagos/penalizaciones/${pacienteId}`, { headers: { Authorization: "Bearer " + token } });
            const penalizaciones = await respPen.json();

            const divPen = document.getElementById("penalizacionesPendientes");
            if (divPen) divPen.innerHTML = "";
            if (penalizaciones.length > 0 && divPen) {
                divPen.style.display = "block";
                penalizaciones.forEach(p => {
                    const div = document.createElement("div");
                    div.className = "pen-item";
                    div.style.marginBottom = "5px";
                    div.textContent = `🔴 Penalización pendiente: $${p.penalizacion}`;
                    divPen.appendChild(div);
                });
            } else if (divPen) {
                divPen.style.display = "none";
            }

            if (modo === "penalizacion") {
                if (form) {
                    form.montoTotal.value = 200;
                    form.motivo.value = "Penalización por inasistencia";
                    form.penalizacion.value = 200;
                }
            } else if (form) {
                form.montoTotal.value = 500;
                form.motivo.value = "Cita atendida";
            }

            modal.style.display = "flex";
        } catch (err) {
            console.error("Error preparando modal de registro:", err);
        }
    } else {
        // Si no hay idCita o estamos en modo normal, mostramos lista y filtros
        modal.style.display = "none";
        if (form) form.style.display = "none";
        await cargarPagos(true);
    }

    // =======================
    // Modal de reporte
    // =======================
    if (btnReporte) btnReporte.addEventListener("click", () => modalFormato.classList.remove("oculto"));
    if (btnCerrarModal) btnCerrarModal.addEventListener("click", () => modalFormato.classList.add("oculto"));
    window.addEventListener("click", (e) => { if (e.target === modalFormato) modalFormato.classList.add("oculto"); });

    if (btnPdf) {
        btnPdf.addEventListener("click", () => {
            generarReportePagosPDF(window._pagosFiltrados);
            modalFormato.classList.add("oculto");
        });
    }
    if (btnExcel) {
        btnExcel.addEventListener("click", () => {
            generarReportePagosExcel(window._pagosFiltrados);
            modalFormato.classList.add("oculto");
        });
    }

}); // end DOMContentLoaded
