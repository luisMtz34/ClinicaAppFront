// psicologos-events.js
import { validarPsicologo } from "./psicologos-validations.js";
import {
  apiObtenerPsicologos,
  apiRegistrarPsicologo,
  apiActualizarPsicologo,
  apiDesactivarPsicologo
} from "./psicologos-api.js";
import { pintarPsicologos, abrirModal, cerrarModal } from "./psicologos-ui.js";

export function initPsicologos(API_URL) {
  const token = localStorage.getItem("accessToken");
  if (!token) return location.href = "../index.html";

  cargarTabla();

  // Registro nuevo
  document.getElementById("formPsicologo").addEventListener("submit", async e => {
    e.preventDefault();

    const data = {
      nombre: formPsicologo.nombre.value.trim(),
      email: formPsicologo.email.value.trim(),
      password: formPsicologo.password.value.trim(),
      telefono: formPsicologo.telefono.value.trim()
    };

    const error = validarPsicologo(data);
    if (error) {
      Swal.fire({ icon: "warning", title: "Validación", text: error });
      return;
    }

    try {
      await apiRegistrarPsicologo(data, token, API_URL);
      Swal.fire("Registrado", "Psicólogo registrado correctamente", "success");
      formPsicologo.reset();
      cargarTabla();
    } catch {
      Swal.fire("Error", "No se pudo registrar", "error");
    }
  });

  // Edición
  document.getElementById("formEditarPsicologo").addEventListener("submit", async e => {
    e.preventDefault();

    const id = editId.value;
    const data = {
      nombre: editNombre.value.trim(),
      email: editEmail.value.trim(),
      telefono: editTelefono.value.trim()
    };

    const error = validarPsicologo({ ...data, password: "temporal" });
    if (error) {
      Swal.fire({ icon: "warning", title: "Validación", text: error });
      return;
    }

    try {
      await apiActualizarPsicologo(id, data, token, API_URL);
      Swal.fire("Actualizado", "Psicólogo actualizado", "success");
      cerrarModal();
      cargarTabla();
    } catch {
      Swal.fire("Error", "No se pudo actualizar", "error");
    }
  });

  // Botones de tabla
  async function cargarTabla() {
    const lista = await apiObtenerPsicologos(token, API_URL);
    pintarPsicologos(lista);

    document.querySelectorAll(".btnEditar").forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const psic = lista.find(p => p.id == id);
        abrirModal(psic);
      };
    });

    document.querySelectorAll(".btnEliminar").forEach(btn => {
      btn.onclick = () => eliminar(btn.dataset.id);
    });
  }

  async function eliminar(id) {
    Swal.fire({
      title: "¿Desactivar psicólogo?",
      icon: "warning",
      showCancelButton: true
    }).then(async res => {
      if (res.isConfirmed) {
        try {
          await apiDesactivarPsicologo(id, token, API_URL);
          Swal.fire("Desactivado", "", "success");
          cargarTabla();
        } catch {
          Swal.fire("Error", "No se pudo desactivar", "error");
        }
      }
    });
  }
  const btnSalir = document.getElementById("btnSalir");
  if (btnSalir) {
    btnSalir.addEventListener("click", () => {
      window.location.href = "../../dashboard-secretaria/home-secretaria.html";
    });
  }
  // Cerrar modal
  document.getElementById("cerrarModal").onclick = cerrarModal;
  window.onclick = e => { if (e.target.id === "modalEditar") cerrarModal(); };
  window.onkeydown = e => { if (e.key === "Escape") cerrarModal(); };
}
