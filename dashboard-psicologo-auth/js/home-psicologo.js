const API_CITAS = "http://localhost:8082/psicologo/citas";

document.addEventListener("DOMContentLoaded", () => {
    // obtener elementos tras carga DOM
    initElements();
    validarSesion();
    cargarNombrePsicologo();
    setFechaHoyCorrecto();
    cargarCitas(true); // por defecto hoy
});

let inputFecha, btnAnterior, btnHoy, btnSiguiente, btnFiltrar, btnTodas;

function initElements() {
    inputFecha = document.getElementById("fechaFiltro");
    btnAnterior = document.getElementById("btnAnterior");
    btnHoy = document.getElementById("btnHoy");
    btnSiguiente = document.getElementById("btnSiguiente");
    btnFiltrar = document.getElementById("btnFiltrar");
    btnTodas = document.getElementById("btnTodas"); // opcional

    // listeners — comprueba que el elemento exista antes de agregar
    if (btnHoy) btnHoy.addEventListener("click", onClickHoy);
    if (btnAnterior) btnAnterior.addEventListener("click", onClickAnterior);
    if (btnSiguiente) btnSiguiente.addEventListener("click", onClickSiguiente);
    if (inputFecha) inputFecha.addEventListener("change", () => cargarCitas(true));
    if (btnFiltrar) btnFiltrar.addEventListener("click", () => cargarCitas(true));
    if (btnTodas) btnTodas.addEventListener("click", () => cargarCitas(false));
}

// ---------- utilidades de fecha (local) ----------
function toYYYYMMDD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function parseFechaLocal(str) {
    // espera "YYYY-MM-DD"
    if (!str) return new Date();
    const parts = str.split("-");
    const y = Number(parts[0]), m = Number(parts[1]), d = Number(parts[2]);
    return new Date(y, m - 1, d);
}

// ---------- handlers de botones ----------
function onClickHoy() {
    const hoy = new Date();
    inputFecha.value = toYYYYMMDD(hoy);
    cargarCitas(true);
}
function onClickAnterior() {
    const fecha = parseFechaLocal(inputFecha.value);
    fecha.setDate(fecha.getDate() - 1);
    inputFecha.value = toYYYYMMDD(fecha);
    cargarCitas(true);
}
function onClickSiguiente() {
    const fecha = parseFechaLocal(inputFecha.value);
    fecha.setDate(fecha.getDate() + 1);
    inputFecha.value = toYYYYMMDD(fecha);
    cargarCitas(true);
}
document.getElementById("logoutBtn").addEventListener("click", () => {
    Swal.fire({
        title: "¿Cerrar sesión?",
        text: "Tu sesión actual se cerrará.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, cerrar sesión",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem("accessToken");

            Swal.fire({
                title: "Sesión cerrada",
                text: "Serás redirigido al login.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });

            setTimeout(() => {
                window.location.href = "../index.html";
            }, 1500);
        }
    });
});



// ---------- sesión / nombre ----------
function validarSesion() {
    if (!localStorage.getItem("accessToken")) {
        window.location.href = "login.html";
    }
}

function setFechaHoyCorrecto() {
    const hoy = new Date();
    // usar fecha local
    document.getElementById("fechaFiltro").value = toYYYYMMDD(hoy);
}

function cargarNombrePsicologo() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        document.getElementById("nombrePsicologo").textContent = "Bienvenido";
        return;
    }
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const nombre = (payload.nombre || "") + " " + (payload.apellido || "");
        document.getElementById("nombrePsicologo").textContent = `Bienvenido, ${nombre}`.trim();
    } catch {
        document.getElementById("nombrePsicologo").textContent = "Bienvenido";
    }
}

// ---------- cargar citas ----------
async function cargarCitas(filtrar = true) {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No token");

        const res = await fetch(API_CITAS, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Error al obtener citas");

        let citas = await res.json();

        if (filtrar) {
            const fechaSeleccionada = inputFecha && inputFecha.value ? inputFecha.value : toYYYYMMDD(new Date());
            citas = citas.filter(c => c.fecha === fechaSeleccionada);
        }

        mostrarCitas(citas);
    } catch (err) {
        console.error("Error cargarCitas:", err);
        const cont = document.getElementById("contenedorCitas");
        if (cont) cont.innerHTML = `<p>Error cargando citas.</p>`;
    }
}

// ---------- mostrar citas ----------
function mostrarCitas(citas) {
    const contenedor = document.getElementById("contenedorCitas");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!Array.isArray(citas) || citas.length === 0) {
        contenedor.innerHTML = `<p>No se encontraron citas.</p>`;
        return;
    }

    citas.forEach(cita => {
        const card = document.createElement("div");
        card.className = "card-cita";

        // fecha y hora se formatean si vienen distintos
        const fecha = cita.fecha || "";
        const hora = cita.hora ? cita.hora.substring(0, 5) : "";

        card.innerHTML = `
    <h3>👤 ${escapeHtml(cita.pacienteNombre || "-")}</h3>

    <div class="card-info">
        <p><strong>📅 Fecha:</strong> ${escapeHtml(fecha)}</p>
        <p><strong>⏰ Hora:</strong> ${escapeHtml(hora)}</p>
        <p><strong>📂 Tipo:</strong> ${cita.tipo ? cita.tipo.replace(/_/g, " ").toLowerCase() : ""}</p>

        <span class="tag">${cita.estado ? cita.estado.replace(/_/g, " ") : ""}</span>
    </div>

    ${cita.estado === "ATENDIDA" ? `
        <button class="btn-pagos" onclick="verPagos(${cita.idCitas || cita.id || 0})">
            Ver Pagos
        </button>
    ` : ``}
`;


        contenedor.appendChild(card);
    });
}

// escape simple para seguridad mínima al insertar texto
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function verPagos(idCita) {
    if (!idCita) return;
    window.location.href = `../dashboard-psicologo-pagos/pagos-psicologo.html?id=${idCita}`;
}

