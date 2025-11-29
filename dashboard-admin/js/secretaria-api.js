// secretaria-api.js
export async function registrarSecretaria(data, token) {
  if (!token) throw new Error("No authentication token provided");

  const res = await fetch(`${CONFIG.API_BASE_URL}/admin/registrar-secretaria`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    // opcional: intentar leer mensaje del backend
    let text;
    try { text = await res.text(); } catch (e) { text = null; }
    throw new Error(text || "Error al registrar secretaria");
  }

  return await res.json();
}
