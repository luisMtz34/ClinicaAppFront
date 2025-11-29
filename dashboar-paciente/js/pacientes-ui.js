// ===========================
// UI - Pacientes
// ===========================

export function renderPacientesTabla(pacientes) {
    const tbody = document.querySelector("#tablaPacientes tbody");
    tbody.innerHTML = "";

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
}

export function llenarModalEdicion(paciente) {
    document.getElementById("editNombre").value = paciente.nombre;
    document.getElementById("editFechaNac").value = paciente.fechaNac;
    document.getElementById("editSexo").value = paciente.sexo;
    document.getElementById("editTelefono").value = paciente.telefono;
    document.getElementById("editContacto").value = paciente.contacto;
    document.getElementById("editParentesco").value = paciente.parentesco;
    document.getElementById("editTelefonoC").value = paciente.telefonoCp;
}

export function abrirModalEdicion() {
    document.getElementById("modalEditarPaciente").style.display = "flex";
}

export function cerrarModalEdicion() {
    document.getElementById("modalEditarPaciente").style.display = "none";
}
