function formatearTexto(texto) {
  if (!texto) return "-";
  return texto
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}

window._paginaActual = 1;
window._itemsPorPagina = 10; 


document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("contenedorTabla");
  const token = localStorage.getItem("accessToken");
  const modal = document.getElementById("modalFormato");
  const btnReporteB = document.getElementById("btnReporte");
  const btnCerrarModal = document.getElementById("btnCerrarModal");
  btnReporteB.addEventListener("click", () => modal.classList.remove("oculto"));
  btnCerrarModal.addEventListener("click", () => modal.classList.add("oculto"));
  // BOTONES DEL MODAL ✔️
  document.getElementById("btnPdf").addEventListener("click", () => {
    generarReporte(window._citasFiltradas ?? window._citas);
    modal.classList.add("oculto");
  });

  document.getElementById("btnExcel").addEventListener("click", () => {
    generarExcel(window._citasFiltradas ?? window._citas);
    modal.classList.add("oculto");
  });

  window.addEventListener("click", (e) => {
    const modal = document.getElementById("modalFormato");

    // Si el modal está visible y el click ocurre directamente en el fondo (modal)
    if (!modal.classList.contains("oculto") && e.target === modal) {
      modal.classList.add("oculto");
    }
  });
  btnReporteB.addEventListener("click", () => modal.classList.remove("oculto"));
  btnCerrarModal.addEventListener("click", () => modal.classList.add("oculto"));



  if (!token) {
    contenedor.innerHTML = `
      <p style="color:red;">⚠️ No hay sesión activa. Inicia sesión nuevamente.</p>
      <a href="/login.html">Ir al inicio de sesión</a>
    `;
    return;
  }

  try {
    // 1️⃣ Cargar psicólogos
    await cargarPsicologos(token);
    await cargarPacientes(token);


    // 2️⃣ Guardar citas globales
    window._citas = await fetchCitas(token);

    // 3️⃣ Renderizar la tabla con TODAS las citas
    renderizarTabla(window._citas);


    // Activar filtros automáticos
    [
      "filtroEstado",
      "filtroConsultorio",
      "filtroPsicologo",
      "filtroFecha",
      "filtroTipo",
      "filtroHora",
      "filtroPaciente"
    ].forEach(id => {
      document.getElementById(id).addEventListener("change", aplicarFiltros);
    });


  } catch (err) {
    console.error(err);
    contenedor.innerHTML = `<p style="color:red;">❌ Error: ${err.message}</p>`;
  }
});



/* ===========================
   📌 1. Cargar psicólogos (con token)
=========================== */
async function cargarPsicologos(token) {
  const select = document.getElementById("filtroPsicologo");

  const res = await fetch(`${CONFIG.API_BASE_URL}/secretaria/psicologos`, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) throw new Error("No se pudieron cargar los psicólogos");

  const psicologos = await res.json();

  select.innerHTML = `<option value="">Todos</option>` +
    psicologos.map(p => `
      <option value="${p.id}">${p.nombre}</option>
    `).join("");

}
/* ===========================
   📌 Cargar pacientes
=========================== */
async function cargarPacientes(token) {
  const select = document.getElementById("filtroPaciente");

  const res = await fetch(`${CONFIG.API_BASE_URL}/secretaria/pacientes`, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) throw new Error("No se pudieron cargar los pacientes");

  const pacientes = await res.json();

  select.innerHTML = `<option value="">Todos</option>` +
    pacientes.map(p => `
      <option value="${p.clave}">${p.nombre}</option>
    `).join("");
}


/* ===========================
   📌 2. Obtener citas (con token)
=========================== */
async function fetchCitas(token) {
  const response = await fetch(`${CONFIG.API_BASE_URL}/secretaria/citas`, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) throw new Error("No se pudieron cargar las citas");

  return await response.json();
}


/* ===========================
   🧾 Renderizar tabla
=========================== */
function renderizarTabla(citas) {
  const contenedor = document.getElementById("contenedorTabla");

  if (!citas || citas.length === 0) {
    contenedor.innerHTML = "<p>No hay citas registradas.</p>";
    return;
  }

  // --- PAGINACIÓN ---
  const totalItems = citas.length;
  const totalPaginas = Math.ceil(totalItems / window._itemsPorPagina);

  if (window._paginaActual > totalPaginas) {
    window._paginaActual = totalPaginas;
  }
  if (window._paginaActual < 1) {
    window._paginaActual = 1;
  }

  const inicio = (window._paginaActual - 1) * window._itemsPorPagina;
  const fin = inicio + window._itemsPorPagina;

  const citasPagina = citas.slice(inicio, fin);

  // --- TABLA ---
  const tabla = document.createElement("table");
  tabla.classList.add("styled-table");

  tabla.innerHTML = `
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Hora</th>
        <th>Paciente</th>
        <th>Psicólogo</th>
        <th>Consultorio</th>
        <th>Tipo</th>
        <th>Estado</th>
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

  // COLORES
  aplicarColoresEstado();

  // PAGINACIÓN
  renderizarPaginacion(totalPaginas);
}

function renderizarPaginacion(totalPaginas) {
    const contenedor = document.getElementById("contenedorTabla");

    // Eliminar cualquier paginación previa
    const vieja = contenedor.querySelector(".paginacion");
    if (vieja) vieja.remove();

    // 🔥 Si solo hay UNA página → NO dibujar paginación
    if (totalPaginas <= 1) return;

    const paginacion = document.createElement("div");
    paginacion.classList.add("paginacion");

    paginacion.innerHTML = `
        <button id="btnPrev" ${window._paginaActual === 1 ? "disabled" : ""}>Anterior</button>
        <span>Página ${window._paginaActual} de ${totalPaginas}</span>
        <button id="btnNext" ${window._paginaActual === totalPaginas ? "disabled" : ""}>Siguiente</button>
    `;

    contenedor.appendChild(paginacion);

    // Eventos de paginación
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



/* ===========================
Colorear celdas de estado
=========================== */
function aplicarColoresEstado() {
  document.querySelectorAll(".estado").forEach(td => {
    const estado = td.getAttribute("data-estado");
    td.style.fontWeight = "bold";

    switch (estado) {
      case "ATENDIDA":
        td.style.color = "#45c482";   // Verde suave
        break;

      case "CONFIRMADA":
        td.style.color = "#2196f3";   // Azul
        break;

      case "ACTIVO":
        td.style.color = "#673ab7";   // Morado
        break;

      case "CANCELADA":
      case "NO_ASISTIO":
        td.style.color = "#f44336";   // Rojo
        break;

      default:
        td.style.color = "#555";
    }

  });
}


/* ===========================
Reporte temporal
=========================== */
function generarReporte(citas) {
  if (!citas || citas.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Reporte de Citas", 14, 18);

  // Crear tabla PDF
  doc.autoTable({
    startY: 25,
    head: [["Fecha", "Hora", "Paciente", "Psicólogo", "Consultorio", "Tipo", "Estado"]],
    body: citas.map(c => [
      c.fecha || "-",
      c.hora || "-",
      c.pacienteNombre || "-",
      c.psicologoNombre || "-",
      c.consultorio || "-",
      formatearTexto(c.tipo),
      formatearTexto(c.estado)
    ]),
  });

  doc.save("reporte_citas.pdf");
}

function generarExcel(citas) {
  if (!citas || citas.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  const data = citas.map(c => ({
    Fecha: c.fecha || "-",
    Hora: c.hora || "-",
    Paciente: c.pacienteNombre || "-",
    Psicólogo: c.psicologoNombre || "-",
    Consultorio: c.consultorio || "-",
    Tipo: formatearTexto(c.tipo),
    Estado: formatearTexto(c.estado)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Citas");
  XLSX.writeFile(wb, "reporte_citas.xlsx");
}


function aplicarFiltros() {
  const estado = document.getElementById("filtroEstado").value;
  const consultorio = document.getElementById("filtroConsultorio").value;
  const psicologo = document.getElementById("filtroPsicologo").value;
  const fecha = document.getElementById("filtroFecha").value;
  const tipo = document.getElementById("filtroTipo").value;
  const hora = document.getElementById("filtroHora").value;
  const paciente = document.getElementById("filtroPaciente").value;

  const filtradas = window._citas.filter(c => {
    return (
      (estado === "" || c.estado === estado) &&
      (consultorio === "" || c.consultorio === consultorio) &&
      (psicologo === "" || c.psicologoId == psicologo) &&
      (fecha === "" || c.fecha === fecha) &&
      (tipo === "" || c.tipo === tipo) &&
      (hora === "" || normalizarHora(c.hora) === hora) &&
      (paciente === "" || c.pacienteId === paciente)
    );
  });

  window._citasFiltradas = filtradas;

  renderizarTabla(filtradas);
}

document.getElementById("btnRestablecer").addEventListener("click", async () => {
  document.getElementById("filtroEstado").value = "";
  document.getElementById("filtroConsultorio").value = "";
  document.getElementById("filtroPsicologo").value = "";
  document.getElementById("filtroFecha").value = "";
  document.getElementById("filtroTipo").value = "";
  document.getElementById("filtroHora").value = "";
  document.getElementById("filtroPaciente").value = "";


  // usamos las citas originales ya cargadas originalmente
  renderizarTabla(window._citas);
});
function normalizarHora(h) {
  if (!h) return "";
  return h.substring(0, 5); // "10:00:00" → "10:00"
}
