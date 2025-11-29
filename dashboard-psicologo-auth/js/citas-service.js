import { inputFecha } from "./home-psicologo.js";
import { toYYYYMMDD } from "./fechas-utils.js";
import { mostrarCitas } from "./citas-ui.js";

const API_CITAS = `${CONFIG.API_BASE_URL}/psicologo/citas`;

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
            const fechaSel =
                inputFecha && inputFecha.value
                    ? inputFecha.value
                    : toYYYYMMDD(new Date());

            citas = citas.filter(c => c.fecha === fechaSel);
        }

        mostrarCitas(citas);

    } catch (err) {
        console.error("Error cargarCitas:", err);
        const cont = document.getElementById("contenedorCitas");
        if (cont) cont.innerHTML = `<p>Error cargando citas.</p>`;
    }
}

export { cargarCitas };
