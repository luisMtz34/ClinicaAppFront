import { cargarPsicologos, cargarPacientes, fetchCitas } from "./services-api.js";
import { renderizarTabla } from "./pagination.js";
import { inicializarUI } from "./ui.js";

window._paginaActual = 1;
window._itemsPorPagina = 10;

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    document.getElementById("contenedorTabla").innerHTML = `
      <p style="color:red;">⚠️ No hay sesión activa.</p>
      <a href="/login.html">Ir al inicio</a>
    `;
    return;
  }

  inicializarUI();

  try {
    const psicologos = await cargarPsicologos(token);
    llenarSelect("filtroPsicologo", psicologos, "id", "nombre");

    const pacientes = await cargarPacientes(token);
    llenarSelect("filtroPaciente", pacientes, "clave", "nombre");

    window._citas = await fetchCitas(token);
    renderizarTabla(window._citas);

  } catch (err) {
    console.error(err);
    document.getElementById("contenedorTabla").innerHTML =
      `<p style="color:red;">❌ Error: ${err.message}</p>`;
  }
});

function llenarSelect(id, data, valueKey, labelKey) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="">Todos</option>` +
    data.map(d => `<option value="${d[valueKey]}">${d[labelKey]}</option>`).join("");
}
