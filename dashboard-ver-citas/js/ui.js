import { generarReporte, generarExcel } from "./reports.js";
import { aplicarFiltros } from "./filters.js";

export function inicializarUI() {
  const modal = document.getElementById("modalFormato");

  document.getElementById("btnReporte").onclick = () => modal.classList.remove("oculto");
  document.getElementById("btnCerrarModal").onclick = () => modal.classList.add("oculto");

  document.getElementById("btnPdf").onclick = () => {
    generarReporte(window._citasFiltradas ?? window._citas);
    modal.classList.add("oculto");
  };

  document.getElementById("btnExcel").onclick = () => {
    generarExcel(window._citasFiltradas ?? window._citas);
    modal.classList.add("oculto");
  };

  window.onclick = e => {
    if (e.target === modal) modal.classList.add("oculto");
  };

  activarFiltros();
}

function activarFiltros() {
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

  document.getElementById("btnRestablecer").onclick = () => {
    [
      "filtroEstado",
      "filtroConsultorio",
      "filtroPsicologo",
      "filtroFecha",
      "filtroTipo",
      "filtroHora",
      "filtroPaciente"
    ].forEach(id => document.getElementById(id).value = "");

    aplicarFiltros();
  };
}
