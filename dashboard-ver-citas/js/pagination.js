import { formatearTexto } from "./utils.js";

export function renderizarTabla(citas) {
  const contenedor = document.getElementById("contenedorTabla");

  if (!citas || citas.length === 0) {
    contenedor.innerHTML = "<p>No hay citas registradas.</p>";
    return;
  }

  const totalItems = citas.length;
  const totalPaginas = Math.ceil(totalItems / window._itemsPorPagina);

  if (window._paginaActual > totalPaginas) window._paginaActual = totalPaginas;
  if (window._paginaActual < 1) window._paginaActual = 1;

  const inicio = (window._paginaActual - 1) * window._itemsPorPagina;
  const citasPagina = citas.slice(inicio, inicio + window._itemsPorPagina);

  const tabla = document.createElement("table");
  tabla.classList.add("styled-table");

  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Fecha</th><th>Hora</th><th>Paciente</th>
        <th>Psicólogo</th><th>Consultorio</th>
        <th>Tipo</th><th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${citasPagina.map(c => `
        <tr>
          <td>${c.fecha || "-"}</td>
          <td>${c.hora || "-"}</td>
          <td>${c.pacienteNombre || "Sin asignar"}</td>
          <td>${c.psicologoNombre || "Sin asignar"}</td>
          <td>${c.consultorio || "-"}</td>
          <td>${formatearTexto(c.tipo)}</td>
          <td class="estado" data-estado="${c.estado}">
            ${formatearTexto(c.estado)}
          </td>
        </tr>
      `).join("")}
    </tbody>
  `;

  contenedor.innerHTML = "";
  contenedor.appendChild(tabla);

  aplicarColoresEstado();
  renderizarPaginacion(totalPaginas);
}

export function renderizarPaginacion(totalPaginas) {
  const contenedor = document.getElementById("contenedorTabla");

  const vieja = contenedor.querySelector(".paginacion");
  if (vieja) vieja.remove();

  if (totalPaginas <= 1) return;

  const paginacion = document.createElement("div");
  paginacion.classList.add("paginacion");

  paginacion.innerHTML = `
    <button id="btnPrev" ${window._paginaActual === 1 ? "disabled" : ""}>Anterior</button>
    <span>Página ${window._paginaActual} de ${totalPaginas}</span>
    <button id="btnNext" ${window._paginaActual === totalPaginas ? "disabled" : ""}>Siguiente</button>
  `;

  contenedor.appendChild(paginacion);

  document.getElementById("btnPrev").onclick = () => {
    if (window._paginaActual > 1) {
      window._paginaActual--;
      renderizarTabla(window._citasFiltradas ?? window._citas);
    }
  };

  document.getElementById("btnNext").onclick = () => {
    if (window._paginaActual < totalPaginas) {
      window._paginaActual++;
      renderizarTabla(window._citasFiltradas ?? window._citas);
    }
  };
}

function aplicarColoresEstado() {
  document.querySelectorAll(".estado").forEach(td => {
    const estado = td.dataset.estado;
    td.style.fontWeight = "bold";

    const colors = {
      ATENDIDA: "#45c482",
      CONFIRMADA: "#2196f3",
      ACTIVO: "#673ab7",
      CANCELADA: "#f44336",
      NO_ASISTIO: "#f44336"
    };

    td.style.color = colors[estado] ?? "#555";
  });
}
