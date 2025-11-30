export function formatearTexto(texto) {
  if (!texto) return "-";
  return texto
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}

export function normalizarHora(h) {
  if (!h) return "";
  return h.substring(0, 5);
}
