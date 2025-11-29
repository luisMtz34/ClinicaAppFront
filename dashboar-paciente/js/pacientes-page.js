import { cargarPacientes } from "./pacientes-events.js";  
import { initPacienteEvents } from "./pacientes-events.js";

const API_URL = `${CONFIG.API_BASE_URL}/secretaria/pacientes`;

document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("accessToken");

    if (!token) {
        Swal.fire({
            icon: "warning",
            title: "Sesión requerida"
        }).then(() => location.href = "../index.html");
        return;
    }

    document.getElementById("btnSalir").addEventListener("click", () => {
        location.href = "../../dashboard-secretaria/home-secretaria.html";
    });

    // cargar pacientes usa API_URL, no token
    await cargarPacientes(API_URL);

    // eventos también usan API_URL
    initPacienteEvents(API_URL);
});
