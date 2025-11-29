// api.js
const API_PAGOS = `${CONFIG.API_BASE_URL}/psicologo/pagos`;

/**
 * Obtiene todos los pagos desde la API
 */
export async function fetchPagos(token) {
    try {
        const response = await fetch(API_PAGOS, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Error al obtener pagos");

        return await response.json();
    } catch (error) {
        console.error("API ERROR:", error);
        return [];
    }
}

/**
 * Registra un nuevo pago
 */
export async function registrarPago(pago, token) {
    try {
        const response = await fetch(API_PAGOS, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(pago)
        });

        if (!response.ok) throw new Error("Error al registrar pago");

        return await response.json();
    } catch (error) {
        console.error("API ERROR:", error);
        return null;
    }
}
