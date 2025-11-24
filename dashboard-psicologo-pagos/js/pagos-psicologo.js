// pagos-psicologo.js (archivo completo corregido)

const API_PAGOS = "http://localhost:8082/psicologo/pagos";
window._pagos = [];
window._pagosFiltrados = [];
let paginaActual = 1;
const pagosPorPagina = 10;

let idCita = null;

document.addEventListener("DOMContentLoaded", async () => {

    const params = new URLSearchParams(window.location.search);
    idCita = params.get("id");

    document.getElementById("btnVolver").addEventListener("click", () => {
        history.back();
    });

    const inputFecha = document.getElementById("fechaFiltro");
    inputFecha.addEventListener("change", () => {
        const fecha = fixFechaInput(inputFecha.value);
        if (fecha) cargarPagosPorFecha(fecha);
        else cargarTodosMisPagos();
    });

    document.getElementById("btnTodosPagos").addEventListener("click", () => {
        inputFecha.value = "";
        cargarTodosMisPagos();
    });

    const token = localStorage.getItem("accessToken");

    try {
        const res = await fetch(API_PAGOS, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("No autorizado");

        const pagos = await res.json();
        pagos.forEach(normalizarFechaPago);

        window._pagos = pagos;
        window._pagosFiltrados = [...pagos];

        if (idCita) {
            const solo = pagos.filter(p => {
                const cid = p.citaId ?? p.citaID ?? p.cita?.id;
                return cid != null && String(cid) === String(idCita);
            });

            if (solo.length > 0) {
                window._pagosFiltrados = solo;
                renderTablaPagos(solo);
            } else {
                renderTablaPagos(window._pagosFiltrados);
            }
        } else {
            renderTablaPagos(window._pagosFiltrados);
        }

    } catch (err) {
        console.error(err);
        Swal.fire("Error", "No se pudieron cargar los pagos", "error");
    }
});

// === Helpers ===

function fixFechaInput(fechaInput) {
    return fechaInput || null;
}

function normalizarFechaPago(p) {
    const iso = p.fechaCita ?? p.fecha ?? "";

    if (!iso) {
        p.fechaCitaSolo = "";
        p.horaCita = "";
        return;
    }

    if (iso.includes("T")) {
        const [fecha, hora] = iso.split("T");
        p.fechaCitaSolo = fecha;
        p.horaCita = (hora || "").substring(0, 5);
    } else {
        p.fechaCitaSolo = iso;
        p.horaCita = p.horaCita || "";
    }
}

function renderTablaPagos(pagos) {
    const tbody = document.getElementById("tabla-pagos-body");
    tbody.innerHTML = "";

    if (!pagos || pagos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center">No hay pagos registrados</td></tr>`;
        calcularTotales([]);
        return;
    }

    pagos.forEach(p => {
        const tr = document.createElement("tr");
        const fecha = p.fechaCitaSolo || "";
        const hora = p.horaCita || "";

        tr.innerHTML = `
            <td>${p.nombrePaciente || "-"}</td>
            <td>${p.nombrePsicologo || "-"}</td>
            <td>$${p.montoTotal || 0}</td>
            <td>${p.penalizacion ? "$" + p.penalizacion : "-"}</td>
            <td>${p.comisionClinica ? "$" + p.comisionClinica : "-"}</td>
            <td>${fecha} ${hora}</td>
            <td>${p.motivo || "-"}</td>
            <td>${p.tipoPago ? p.tipoPago.toLowerCase() : "-"}</td>
            <td>${p.observaciones || "-"}</td>
        `;
        tbody.appendChild(tr);
    });

    calcularTotales(pagos);
}

async function cargarTodosMisPagos() {

    if (window._pagos.length > 0) {
        window._pagosFiltrados = [...window._pagos];
        renderTablaPagos(window._pagosFiltrados);
        return;
    }

    const token = localStorage.getItem("accessToken");

    try {
        const res = await fetch(API_PAGOS, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const pagos = await res.json();

        pagos.forEach(normalizarFechaPago);
        window._pagos = pagos;
        window._pagosFiltrados = [...pagos];
        renderTablaPagos(window._pagosFiltrados);

    } catch (err) {
        console.error(err);
        Swal.fire("Error", "No se pudieron cargar los pagos", "error");
    }
}

async function cargarPagosPorFecha(fecha) {

    if (!window._pagos || window._pagos.length === 0) {
        await cargarTodosMisPagos();
    }

    const filtrados = window._pagos.filter(p => {
        if (!p.fechaCitaSolo) normalizarFechaPago(p);
        return p.fechaCitaSolo === fecha;
    });

    window._pagosFiltrados = filtrados;
    renderTablaPagos(filtrados);
}

function verPagos(citaId) {
    if (!citaId) return;
    window.location.href = `pagos-psicologo.html?id=${citaId}`;
}

// === CORRECCIÓN IMPORTANTE ===
// totalComisiones no existía → ahora sí se calcula
function calcularTotales(pagos) {

    const totalPagos = pagos.reduce((acc, p) => acc + (p.montoTotal || 0), 0);
    const totalComisiones = pagos.reduce((acc, p) => acc + (p.comisionClinica || 0), 0);
    const totalPsicologo = totalPagos - totalComisiones;

    document.getElementById("totalPagos").textContent = "$" + totalPagos.toFixed(2);
    document.getElementById("totalComisiones").textContent = "$" + totalComisiones.toFixed(2);
    document.getElementById("totalPsicologo").textContent = "$" + totalPsicologo.toFixed(2);
}
