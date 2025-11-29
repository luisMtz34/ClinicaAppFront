// psicologos-page.js
import { initPsicologos } from "./psicologos-events.js";

const API_URL = `${CONFIG.API_BASE_URL}/secretaria/psicologos`;

document.addEventListener("DOMContentLoaded", () => {
  initPsicologos(API_URL);
});
    