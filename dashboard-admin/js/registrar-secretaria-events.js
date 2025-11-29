// registrar-secretaria-events.js
import { validarSecretaria } from "./secretaria-validations.js";
import { registrarSecretaria } from "./secretaria-api.js";

export function initRegistrarSecretariaEvents() {
  const form = document.getElementById("formSecretaria");
  if (!form) return console.warn("No se encontró #formSecretaria en DOM");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      nombre: form.nombre.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value.trim(),
      telefono: form.telefono.value.trim(),
      turno: form.turno.value
    };

    const errorMsg = validarSecretaria(data);
    if (errorMsg) {
      Swal.fire({ icon: "warning", title: "Validación", text: errorMsg });
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Sin autenticación",
        text: "No tienes sesión iniciada. Inicia sesión nuevamente."
      });
      return;
    }

    try {
      const result = await registrarSecretaria(data, token);
      Swal.fire({
        icon: "success",
        title: "Registrada correctamente",
        text: `La secretaria ${result.nombre} fue registrada exitosamente.`,
        confirmButtonText: "Aceptar"
      });
      form.reset();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo registrar la secretaria. Revisa el servidor."
      });
    }
  });

  const btnVolver = document.getElementById("btnVolver");
  if (btnVolver) {
    btnVolver.addEventListener("click", () => window.history.back());
  }
}
