export async function cargarPsicologos(token) {
  const res = await fetch(`${CONFIG.API_BASE_URL}/secretaria/psicologos`, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) throw new Error("No se pudieron cargar los psicólogos");
  return await res.json();
}

export async function cargarPacientes(token) {
  const res = await fetch(`${CONFIG.API_BASE_URL}/secretaria/pacientes`, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) throw new Error("No se pudieron cargar los pacientes");
  return await res.json();
}

export async function fetchCitas(token) {
  const res = await fetch(`${CONFIG.API_BASE_URL}/secretaria/citas`, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) throw new Error("No se pudieron cargar las citas");
  return await res.json();
}
