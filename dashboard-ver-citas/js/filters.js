import { normalizarHora } from "./utils.js";
import { renderizarTabla } from "./pagination.js";

export function aplicarFiltros() {
    const estado = filtro("filtroEstado");
    const consultorio = filtro("filtroConsultorio");
    const psicologo = filtro("filtroPsicologo");
    const fecha = filtro("filtroFecha");
    const tipo = filtro("filtroTipo");
    const hora = filtro("filtroHora");
    const paciente = filtro("filtroPaciente");

    const filtradas = window._citas.filter(c => (
        (estado === "" || c.estado === estado) &&
        (consultorio === "" || c.consultorio === consultorio) &&
        (psicologo === "" || c.psicologoId == psicologo) &&
        (fecha === "" || c.fecha === fecha) &&
        (tipo === "" || normalizarTipo(c.tipo) === normalizarTipo(tipo)) &&
        (hora === "" || normalizarHora(c.hora) === hora) &&
        (paciente === "" || c.pacienteId === paciente)
    ));

    window._citasFiltradas = filtradas;
    renderizarTabla(filtradas);
}

function filtro(id) {
    return document.getElementById(id).value;
}

function normalizarTipo(t) {
    if (!t) return "";
    t = t.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    t = t.replace(/\s+/g, "_");
    if (t === "SUBSECUENTE") return "SEGUIMIENTO"; // mapeo
    if (t === "PRIMERA_VEZ") return "PRIMERA_VEZ";
    return t;
}

