const API_URL = "http://localhost:8082/secretaria/pacientes";

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("accessToken");

    // Si no hay token, redirige al login
    if (!token) {
        alert("Debes iniciar sesión para acceder a esta página.");
        window.location.href = "../index.html";
        return;
    }

    // Botón para salir: regresa al home-secretaria
    document.getElementById("btnSalir").addEventListener("click", () => {
        // No borramos token si solo queremos regresar
        window.location.href = "../dashboard-secretaria/home-secretaria.html";
    });

    // Cargar pacientes
    await obtenerPacientes(token);

    // Manejar envío del formulario
    const form = document.getElementById("formPaciente");
    form.addEventListener("submit", (e) => registrarPaciente(e, token));
});

// --- Función para registrar paciente ---
async function registrarPaciente(e, token) {
    e.preventDefault();

    const form = e.target; // <-- esto asegura que tengas el formulario correcto

    const paciente = {
        clave: form.querySelector("#clave").value,
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
            alert("Tu sesión expiró. Inicia sesión de nuevo.");
            localStorage.removeItem("accessToken");
            window.location.href = "../index.html";
            return;
        }

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Error al registrar paciente");
        }

        alert("Paciente registrado correctamente ✅");
        form.reset();
        await obtenerPacientes(token);
    } catch (error) {
        console.error(error);
        alert("No se pudo registrar el paciente ❌");
    }
}


async function obtenerPacientes(token) {
    try {
        const response = await fetch(`${API_URL}`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (response.status === 401) {
            alert("Tu sesión expiró. Inicia sesión de nuevo.");
            localStorage.removeItem("accessToken");
            window.location.href = "../index.html";
            return;
        }

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Error al obtener pacientes");
        }

        const pacientes = await response.json();
        const tbody = document.querySelector("#tablaPacientes tbody");
        tbody.innerHTML = "";

        // Guardar globalmente para usarlo en el modal
        window.listaPacientes = pacientes;

        pacientes.forEach(p => {
            const row = document.createElement("tr");
            row.innerHTML = `
            <td>${p.clave}</td>
            <td>${p.nombre}</td>
            <td>${p.fechaNac}</td>
            <td>${p.sexo}</td>
            <td>${p.telefono}</td>
            <td>${p.contacto}</td>
            <td>${p.parentesco}</td>
            <td>${p.telefonoCp}</td>
            <td>${p.estado ?? "ACTIVO"}</td>
            <td>
                <button class="btnEditar" data-clave="${p.clave}">Editar</button>
            </td>
        `;

            tbody.appendChild(row);
        });

        // 🔹 Asignar eventos de edición después de crear la tabla
        agregarBotonesEditarPacientes();

    } catch (error) {
        console.error(error);
    }
}

// Modal y formulario
const modalPaciente = document.getElementById("modalEditarPaciente");
const formEditarPaciente = document.getElementById("formEditarPaciente");
const btnCerrarModalPaciente = document.getElementById("cerrarModalPaciente");

// Abrir modal al hacer click en Editar
function agregarBotonesEditarPacientes() {
    document.querySelectorAll(".btnEditar").forEach(btn => {
        btn.addEventListener("click", e => {
            const clave = e.target.dataset.clave;
            const paciente = window.listaPacientes.find(p => p.clave == clave);

            document.getElementById("editClave").value = paciente.clave;
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
}

// Cerrar modal
btnCerrarModalPaciente.addEventListener("click", () => {
    modalPaciente.style.display = "none";
});

// Guardar cambios
formEditarPaciente.addEventListener("submit", async e => {
    e.preventDefault();

    const token = localStorage.getItem("accessToken");
    const clave = document.getElementById("editClave").value;

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
        const response = await fetch(`${API_URL}/${clave}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(pacienteActualizado)
        });

        if (!response.ok) throw new Error("Error al actualizar el paciente");

        alert("Paciente actualizado correctamente ✅");
        modalPaciente.style.display = "none";
        await obtenerPacientes(token);
    } catch (error) {
        console.error(error);
        alert("❌ " + error.message);
    }
});
