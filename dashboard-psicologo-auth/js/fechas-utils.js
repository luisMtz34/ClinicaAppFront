import { inputFecha } from "./home-psicologo.js";

function toYYYYMMDD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function parseFechaLocal(str) {
    if (!str) return new Date();
    const p = str.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

function initFechaHoy() {
    const hoy = new Date();
    inputFecha.value = toYYYYMMDD(hoy);
}

export { toYYYYMMDD, parseFechaLocal, initFechaHoy };
