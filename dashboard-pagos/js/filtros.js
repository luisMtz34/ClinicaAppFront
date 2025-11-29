import { _pagos, _pagosFiltrados, resetPaginacion } from "./utils.js";

export function aplicarFiltros() {

    const psicologo = document.getElementById("filtroPsicologoPago")?.value || "";
    const paciente = document.getElementById("filtroPacientePago")?.value || "";
    const fecha = document.getElementById("filtroFechaPago")?.value || "";
    const hora = document.getElementById("filtroHoraPago")?.value || "";
    const tipoPago = document.getElementById("filtroTipoPago")?.value || "";
    const penalizacion = document.getElementById("filtroPenalizacion")?.value || "";
    const motivo = document.getElementById("filtroMotivo")?.value || "";

    let resultado = [..._pagos];

    // -- FILTRO POR PSICÓLOGO --
    if (psicologo !== "") {
        resultado = resultado.filter(p => String(p.psicologoId) === psicologo);
    }

    // -- FILTRO POR PACIENTE --
    if (paciente !== "") {
        resultado = resultado.filter(p => String(p.pacienteId) === paciente);
    }

    // -- FILTRO POR FECHA DE LA CITA --
    if (fecha !== "") {
        resultado = resultado.filter(p => p.fechaCita === fecha);
    }

    // -- FILTRO POR HORA DE LA CITA --
    if (hora !== "") {
        resultado = resultado.filter(p => p.horaCita === hora);
    }

    // -- FILTRO POR TIPO DE PAGO --
    if (tipoPago !== "") {
        resultado = resultado.filter(p => p.tipoPago === tipoPago);
    }

    // -- FILTRO POR SI ES PENALIZACIÓN --
    if (penalizacion !== "") {
        // penalizacion = "true" | "false"
        resultado = resultado.filter(p => String(p.penalizacion > 0) === penalizacion);
    }

    // -- FILTRO POR MOTIVO --
    if (motivo !== "") {
        resultado = resultado.filter(p => p.motivo === motivo);
    }

    // Guardar resultado final
    _pagosFiltrados.length = 0;
    resultado.forEach(p => _pagosFiltrados.push(p));

    resetPaginacion();
}
