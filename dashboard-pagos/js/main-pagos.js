// main-pagos.js
import { setPagos } from "./utils.js";
import { aplicarFiltros } from "./filtros.js";
import { initEventos } from "./eventos.js";

const API_PAGOS = `${CONFIG.API_BASE_URL}/pagos`;

document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("accessToken");

    if (!token) {
        Swal.fire({
            icon: "warning",
            title: "Sesión requerida"
        }).then(() => location.href = "../index.html");
        return;
    }

    // Cargar pagos desde backend
    try {
        const res = await fetch(API_PAGOS, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Error al obtener pagos");

        const pagos = await res.json();

        // Guardar pagos en memoria
        setPagos(pagos);

        // Aplicar filtros iniciales
        aplicarFiltros();

        // Renderizar tabla
        renderTabla();

        // Activar eventos
        initEventos();

    } catch (err) {
        console.error(err);
        Swal.fire("Error", "No se pudieron cargar los pagos", "error");
    }

    // Botón salir
    const btnSalir = document.getElementById("btnSalir");
    if (btnSalir) {
        btnSalir.addEventListener("click", () => {
            window.location.href = "../../dashboard-secretaria/home-secretaria.html";
        });
    }
});
