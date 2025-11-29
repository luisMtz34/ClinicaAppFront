// ===========================
// API - Pacientes
// ===========================
export async function apiRegistrarPaciente(paciente, token, API_URL) {
    const response = await fetch(`${API_URL}/registrar`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(paciente)
    });
    return response;
}

export async function apiObtenerPacientes(token, API_URL) {
    const response = await fetch(`${API_URL}`, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });
    return response;
}

export async function apiActualizarPaciente(clave, paciente, token, API_URL) {
    const response = await fetch(`${API_URL}/${clave}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(paciente)
    });
    return response;
}

export async function apiDesactivarPaciente(clave, token, API_URL) {
    const response = await fetch(`${API_URL}/${clave}/desactivar`, {
        method: "PUT",
        headers: {
            "Authorization": "Bearer " + token
        }
    });
    return response;
}
