import { formatearTexto } from "./utils.js";

export function generarReporte(citas) {
  if (!citas.length) return alert("No hay datos para exportar");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Reporte de Citas", 14, 18);

  doc.autoTable({
    startY: 25,
    head: [["Fecha", "Hora", "Paciente", "Psicólogo", "Consultorio", "Tipo", "Estado"]],
    body: citas.map(c => [
      c.fecha, c.hora,
      c.pacienteNombre,
      c.psicologoNombre,
      c.consultorio,
      formatearTexto(c.tipo),
      formatearTexto(c.estado)
    ])
  });

  doc.save("reporte_citas.pdf");
}

export function generarExcel(citas) {
  if (!citas.length) return alert("No hay datos para exportar");

  const ws = XLSX.utils.json_to_sheet(
    citas.map(c => ({
      Fecha: c.fecha,
      Hora: c.hora,
      Paciente: c.pacienteNombre,
      Psicólogo: c.psicologoNombre,
      Consultorio: c.consultorio,
      Tipo: formatearTexto(c.tipo),
      Estado: formatearTexto(c.estado)
    }))
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Citas");
  XLSX.writeFile(wb, "reporte_citas.xlsx");
}
