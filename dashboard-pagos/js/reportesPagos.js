// reportesPagos.js

// Nombre del centro y logo (emoji por simplicidad; puedes reemplazarlo con ruta de imagen si quieres)
const NOMBRE_CENTRO = "Centro de Psicoterapia Cognitivo Conductual Autlán";
const ICONO = "🧠"; // reemplaza con URL si quieres imagen

// ==========================
// 📄 Generar reporte PDF
// ==========================
// reportes.js
function generarReportePagosPDF(pagos) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    // ===== Título centrado =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Centro de Psicoterapia Cognitivo Conductual Autlán", pageWidth / 2, 20, { align: "center" });

    // ===== Tabla =====
    const headers = [["Paciente", "Psicólogo", "Monto", "Penalización", "Comisión", "Fecha", "Motivo", "Tipo", "Obs"]];
    const rows = pagos.map(p => [
        p.nombrePaciente || "-",
        p.nombrePsicologo || "-",
        `$${p.montoTotal || 0}`,
        p.penalizacion ? `$${p.penalizacion}` : "-",
        p.comisionClinica ? `$${p.comisionClinica}` : "-",
        `${p.fechaCita || ""} ${p.horaCita || ""}`,
        p.motivo || "-",
        p.tipoPago || "-",
        p.observaciones || "-"
    ]);

    doc.autoTable({
        head: headers,
        body: rows,
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 10 }
    });

    // ===== Totales =====
    const pagosAtendidos = pagos.filter(p => p.tipoPago !== "PENALIZACION");
    const totalPagos = pagosAtendidos.reduce((acc, p) => acc + (p.montoTotal || 0), 0);
    const totalComisiones = pagosAtendidos.reduce((acc, p) => acc + (p.comisionClinica || 0), 0);
    const totalPsicologo = totalPagos - totalComisiones;

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Pagos: $${totalPagos.toFixed(2)}`, pageWidth / 2, finalY, { align: "center" });
    doc.text(`Total Comisiones: $${totalComisiones.toFixed(2)}`, pageWidth / 2, finalY + 7, { align: "center" });
    doc.text(`Total Psicólogo: $${totalPsicologo.toFixed(2)}`, pageWidth / 2, finalY + 14, { align: "center" });

    // ===== Guardar PDF =====
    doc.save("reporte_pagos.pdf");
}

// ==========================
// 📊 Generar reporte Excel
// ==========================
function generarReportePagosExcel(pagos) {
    const wb = XLSX.utils.book_new();

    const NOMBRE_CENTRO = "Centro de Psicoterapia Cognitivo Conductual Autlán";

    // Crear arreglo de datos
    const datos = pagos.map(p => ({
        Paciente: p.nombrePaciente || "-",
        Psicologo: p.nombrePsicologo || "-",
        Monto: p.montoTotal || 0,
        Penalizacion: p.penalizacion || 0,
        Comision: p.comisionClinica || 0,
        FechaHora: `${p.fechaCita || ""} ${p.horaCita || ""}`,
        Motivo: p.motivo || "-",
        TipoPago: p.tipoPago || "-",
        Observaciones: p.observaciones || "-"
    }));

    // Totales
    const pagosAtendidos = pagos.filter(p => p.tipoPago !== "PENALIZACION");
    const totalPagos = pagosAtendidos.reduce((acc, p) => acc + (p.montoTotal || 0), 0);
    const totalComisiones = pagosAtendidos.reduce((acc, p) => acc + (p.comisionClinica || 0), 0);
    const totalPsicologo = totalPagos - totalComisiones;

    // Crear hoja vacía
    const hoja = XLSX.utils.json_to_sheet([]);

    // Insertar título en la primera fila (centrado visualmente)
    XLSX.utils.sheet_add_aoa(hoja, [[NOMBRE_CENTRO]], { origin: "A1" });

    // Insertar datos empezando en fila 3
    XLSX.utils.sheet_add_json(hoja, datos, { origin: "A3", skipHeader: false });

    // Insertar totales debajo de la tabla
    const filaTotales = datos.length + 4;
    XLSX.utils.sheet_add_aoa(hoja, [
        [`Total Pagos: $${totalPagos.toFixed(2)}`],
        [`Total Comisiones: $${totalComisiones.toFixed(2)}`],
        [`Total Psicólogo: $${totalPsicologo.toFixed(2)}`]
    ], { origin: `A${filaTotales}` });

    XLSX.utils.book_append_sheet(wb, hoja, "Pagos");
    XLSX.writeFile(wb, "Reporte_Pagos.xlsx");
}
