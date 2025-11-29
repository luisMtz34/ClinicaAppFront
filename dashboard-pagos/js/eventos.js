// eventos.js
import { aplicarFiltros } from "./filtros.js";
import { generarReportePagosPDF, generarReportePagosExcel } from "./reportesPagos.js";
import { _pagosFiltrados } from "./utils.js";

export function initEventos() {
    // Inputs de filtros
    const filtroPaciente = document.getElementById("filtroPaciente");
    const filtroFecha = document.getElementById("filtroFecha");
    const filtroMonto = document.getElementById("filtroMonto");

    if (filtroPaciente)
        filtroPaciente.addEventListener("input", () => { aplicarFiltros(); renderTabla(); });

    if (filtroFecha)
        filtroFecha.addEventListener("change", () => { aplicarFiltros(); renderTabla(); });

    if (filtroMonto)
        filtroMonto.addEventListener("input", () => { aplicarFiltros(); renderTabla(); });

    // Botones de reporte
    const btnReportePDF = document.getElementById("btnReportePDF");
    if (btnReportePDF)
        btnReportePDF.addEventListener("click", () => {
            generarReportePagosPDF(_pagosFiltrados);
        });

    const btnReporteExcel = document.getElementById("btnReporteExcel");
    if (btnReporteExcel)
        btnReporteExcel.addEventListener("click", () => {
            generarReportePagosExcel(_pagosFiltrados);
        });
}
