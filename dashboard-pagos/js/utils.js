// utils.js

export let _pagos = [];           // Todos los pagos cargados
export let _pagosFiltrados = [];  // Pagos luego de filtros

export let paginaActual = 1;
export const pagosPorPagina = 10;

/**
 * Actualiza el estado global _pagos
 */
export function setPagos(lista) {
    _pagos = lista;
}
export function setPagosFiltrados(lista) {
    _pagosFiltrados = lista;
}
/**
 * Cambia la página actual
 */
export function cambiarPagina(num) {
    paginaActual = num;
}

/**
 * Devuelve un rango recortado según la paginación actual
 */
export function obtenerPagosPaginados() {
    const inicio = (paginaActual - 1) * pagosPorPagina;
    const fin = inicio + pagosPorPagina;
    return _pagosFiltrados.slice(inicio, fin);
}

/**
 * Reinicia la paginación cuando se aplican filtros
 */
export function resetPaginacion() {
    paginaActual = 1;
}
