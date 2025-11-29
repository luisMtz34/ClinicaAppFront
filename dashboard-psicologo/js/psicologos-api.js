// psicologos-api.js

export async function apiObtenerPsicologos(token, API_URL) {
  const res = await fetch(API_URL, {
    headers: { "Authorization": "Bearer " + token }
  });

  if (!res.ok) throw new Error("Error al obtener psicólogos");

  return await res.json();
}

export async function apiRegistrarPsicologo(data, token, API_URL) {
  const res = await fetch(`${API_URL}/registrar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error(await res.text());

  return await res.json();
}

export async function apiActualizarPsicologo(id, data, token, API_URL) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error(await res.text());

  return await res.json();
}

export async function apiDesactivarPsicologo(id, token, API_URL) {
  const res = await fetch(`${API_URL}/${id}/desactivar`, {
    method: "PUT",
    headers: { "Authorization": "Bearer " + token }
  });

  if (!res.ok) throw new Error("Error al desactivar psicólogo");

  return true;
}
