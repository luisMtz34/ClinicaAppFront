import {
    apiRegistrarPaciente,
    apiObtenerPacientes,
    apiActualizarPaciente,
    apiDesactivarPaciente
} from "./pacientes-api.js";

import {
    renderPacientesTabla,
    llenarModalEdicion,
    abrirModalEdicion,
    cerrarModalEdicion
} from "./pacientes-ui.js";

let clavePacienteEditando = null;

export function initPacienteEvents(API_URL) {
    const form = document.getElementById("formPaciente");
    const formEditar = document.getElementById("formEditarPaciente");
    const btnCerrarModal = document.getElementById("cerrarModalPaciente");

    const token = localStorage.getItem("accessToken");


    // ===========================
    // Registrar Paciente
    // ===========================
    form.addEventListener("submit", async e => {
        e.preventDefault();

        const paciente = {
            nombre: form.querySelector("#nombre").value,
            fechaNac: form.querySelector("#fechaNac").value,
            sexo: form.querySelector("#sexo").value,
            telefono: form.querySelector("#telefono").value,
            contacto: form.querySelector("#contacto").value,
            parentesco: form.querySelector("#parentesco").value,
            telefonoCp: form.querySelector("#telefonoC").value
        };

        const response = await apiRegistrarPaciente(paciente, token, API_URL);

        if (response.status === 401) {
            Swal.fire({ icon: "error", title: "Sesión expirada" });
            localStorage.removeItem("accessToken");
            return location.href = "../index.html";
        }

        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error registrando" });
            return;
        }

        Swal.fire({ icon: "success", title: "Paciente registrado" });
        form.reset();
        await cargarPacientes(API_URL);
    });


    // ===========================
    // Editar Paciente
    // ===========================
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("btnEditar")) {
            clavePacienteEditando = e.target.dataset.clave;
            const paciente = window.listaPacientes.find(p => p.clave == clavePacienteEditando);

            llenarModalEdicion(paciente);
            abrirModalEdicion();
        }

        if (e.target.classList.contains("btnEliminar")) {
            const clave = e.target.dataset.clave;

            const confirm = await Swal.fire({
                icon: "warning",
                title: "¿Desactivar paciente?",
                showCancelButton: true
            });

            if (!confirm.isConfirmed) return;

            const response = await apiDesactivarPaciente(clave, token, API_URL);

            if (!response.ok) {
                Swal.fire({ icon: "error", title: "No se pudo desactivar" });
                return;
            }

            Swal.fire({ icon: "success", title: "Paciente desactivado" });
            await cargarPacientes(API_URL);
        }
    });


    // ===========================
    // Guardar cambios edición
    // ===========================
    formEditar.addEventListener("submit", async e => {
        e.preventDefault();

        const paciente = {
            nombre: document.getElementById("editNombre").value,
            fechaNac: document.getElementById("editFechaNac").value,
            sexo: document.getElementById("editSexo").value,
            telefono: document.getElementById("editTelefono").value,
            contacto: document.getElementById("editContacto").value,
            parentesco: document.getElementById("editParentesco").value,
            telefonoCp: document.getElementById("editTelefonoC").value
        };

        const response = await apiActualizarPaciente(clavePacienteEditando, paciente, token, API_URL);

        if (!response.ok) {
            Swal.fire({ icon: "error", title: "Error actualizando" });
            return;
        }

        Swal.fire({ icon: "success", title: "Actualizado" });
        cerrarModalEdicion();
        await cargarPacientes(API_URL);
    });

    btnCerrarModal.addEventListener("click", cerrarModalEdicion);
}


// ===========================
// Función Global para recargar pacientes
// ===========================
export async function cargarPacientes(API_URL) {
    const token = localStorage.getItem("accessToken");

    const response = await apiObtenerPacientes(token, API_URL);

    if (response.status === 401) {
        Swal.fire({ icon: "error", title: "Sesión expirada" });
        localStorage.removeItem("accessToken");
        return location.href = "../index.html";
    }

    const pacientes = await response.json();
    window.listaPacientes = pacientes;

    renderPacientesTabla(pacientes);
}
