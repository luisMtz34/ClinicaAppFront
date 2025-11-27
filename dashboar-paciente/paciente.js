const API_URL = `${CONFIG.API_BASE_URL}/secretaria/pacientes`;
let clavePacienteEditando = null;

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        Swal.fire({
            icon: "warning",
            title: "Sesión requerida",
            text: "Debes iniciar sesión para acceder a esta página."
        }).then(() => {
            window.location.href = "../index.html";
        });
        return;
    }

    document.getElementById("btnSalir").addEventListener("click", () => {
        window.location.href = "../dashboard-secretaria/home-secretaria.html";
    });

    await obtenerPacientes(token);

    const form = document.getElementById("formPaciente");
    form.addEventListener("submit", (e) => registrarPaciente(e, token));
});

// ===========================
// Registrar Paciente
// ===========================
async function registrarPaciente(e, token) {
    e.preventDefault();

    const form = e.target;

    const paciente = {
        nombre: form.querySelector("#nombre").value,
        fechaNac: form.querySelector("#fechaNac").value,
        sexo: form.querySelector("#sexo").value,
        telefono: form.querySelector("#telefono").value,
        contacto: form.querySelector("#contacto").value,
        parentesco: form.querySelector("#parentesco").value,
        telefonoCp: form.querySelector("#telefonoC").value
    };

    try {
        const response = await fetch(`${API_URL}/registrar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(paciente)
        });

        if (response.status === 401) {
            Swal.fire({
                icon: "error",
                title: "Sesión expirada",
                text: "Inicia sesión nuevamente."
            }).then(() => {
                localStorage.removeItem("accessToken");
                window.location.href = "../index.html";
            });
            return;
        }

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Error al registrar paciente");
        }

        Swal.fire({
            icon: "success",
            title: "Paciente registrado",
            text: "El paciente se registró correctamente."
        });

        form.reset();
        await obtenerPacientes(token);
    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo registrar el paciente."
        });
    }
}

// ===========================
// Obtener Pacientes
// ===========================
async function obtenerPacientes(token) {
    try {
        const response = await fetch(`${API_URL}`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (response.status === 401) {
            Swal.fire({
                icon: "error",
                title: "Sesión expirada",
                text: "Inicia sesión nuevamente."
            }).then(() => {
                localStorage.removeItem("accessToken");
                window.location.href = "../index.html";
            });
            return;
        }

        if (!response.ok) {
            throw new Error("Error al obtener pacientes");
        }

        const pacientes = await response.json();
        const tbody = document.querySelector("#tablaPacientes tbody");
        tbody.innerHTML = "";

        window.listaPacientes = pacientes;

        pacientes.forEach(p => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${p.nombre}</td>
                <td>${p.fechaNac}</td>
                <td>${p.sexo}</td>
                <td>${p.telefono}</td>
                <td>${p.contacto}</td>
                <td>${p.parentesco}</td>
                <td>${p.telefonoCp}</td>
                <td>
                    <button class="btnEditar" data-clave="${p.clave}">Editar</button>
                    <button class="btnEliminar" data-clave="${p.clave}">Eliminar</button>

                </td>
            `;
            tbody.appendChild(row);
        });

        agregarBotonesEditarPacientes();
    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudieron cargar los pacientes."
        });
    }
}

// ===========================
// Modal Edición
// ===========================
const modalPaciente = document.getElementById("modalEditarPaciente");
const formEditarPaciente = document.getElementById("formEditarPaciente");
const btnCerrarModalPaciente = document.getElementById("cerrarModalPaciente");

function agregarBotonesEditarPacientes() {
    document.querySelectorAll(".btnEditar").forEach(btn => {
        btn.addEventListener("click", e => {
            const clave = e.target.dataset.clave;
            clavePacienteEditando = clave;

            const paciente = window.listaPacientes.find(p => p.clave == clave);

            document.getElementById("editNombre").value = paciente.nombre;
            document.getElementById("editFechaNac").value = paciente.fechaNac;
            document.getElementById("editSexo").value = paciente.sexo;
            document.getElementById("editTelefono").value = paciente.telefono;
            document.getElementById("editContacto").value = paciente.contacto;
            document.getElementById("editParentesco").value = paciente.parentesco;
            document.getElementById("editTelefonoC").value = paciente.telefonoCp;

            modalPaciente.style.display = "flex";
        });
    });

    // ===============================
    // 🔥 BOTÓN ELIMINAR / DESACTIVAR
    // ===============================
    document.querySelectorAll(".btnEliminar").forEach(btn => {
        btn.addEventListener("click", async e => {
            const clave = e.target.dataset.clave;
            const token = localStorage.getItem("accessToken");

            const confirm = await Swal.fire({
                icon: "warning",
                title: "¿Desactivar paciente?",
                text: "El paciente no podrá ser usado en nuevas citas.",
                showCancelButton: true,
                confirmButtonText: "Sí, desactivar",
                cancelButtonText: "Cancelar"
            });

            if (!confirm.isConfirmed) return;

            try {
                const response = await fetch(`${API_URL}/${clave}/desactivar`, {
                    method: "PUT",
                    headers: {
                        "Authorization": "Bearer " + token
                    }
                });

                if (!response.ok) throw new Error("Error al desactivar");

                Swal.fire({
                    icon: "success",
                    title: "Paciente desactivado",
                    text: "El paciente fue marcado como INACTIVO."
                });

                await obtenerPacientes(token);
            } catch (error) {
                console.error(error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo desactivar el paciente."
                });
            }
        });
    });
}


btnCerrarModalPaciente.addEventListener("click", () => {
    modalPaciente.style.display = "none";
});

// ===========================
// Guardar Cambios
// ===========================
formEditarPaciente.addEventListener("submit", async e => {
    e.preventDefault();

    const token = localStorage.getItem("accessToken");

    const pacienteActualizado = {
        nombre: document.getElementById("editNombre").value,
        fechaNac: document.getElementById("editFechaNac").value,
        sexo: document.getElementById("editSexo").value,
        telefono: document.getElementById("editTelefono").value,
        contacto: document.getElementById("editContacto").value,
        parentesco: document.getElementById("editParentesco").value,
        telefonoCp: document.getElementById("editTelefonoC").value
    };

    try {
        const response = await fetch(`${API_URL}/${clavePacienteEditando}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(pacienteActualizado)
        });

        if (!response.ok) throw new Error("Error al actualizar");

        Swal.fire({
            icon: "success",
            title: "Paciente actualizado",
            text: "Los cambios se guardaron correctamente."
        });

        modalPaciente.style.display = "none";
        await obtenerPacientes(token);
    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar el paciente."
        });
    }
});
