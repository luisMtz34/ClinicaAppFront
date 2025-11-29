function mostrarCitas(citas) {
    const contenedor = document.getElementById("contenedorCitas");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!Array.isArray(citas) || citas.length === 0) {
        contenedor.innerHTML = `<p>No se encontraron citas.</p>`;
        return;
    }

    citas.forEach(cita => {
        const card = document.createElement("div");
        card.className = "card-cita";

        const fecha = cita.fecha || "";
        const hora = cita.hora ? cita.hora.substring(0, 5) : "";

        card.innerHTML = `
            <h3>👤 ${escapeHtml(cita.pacienteNombre || "-")}</h3>

            <div class="card-info">
                <p><strong>📅 Fecha:</strong> ${escapeHtml(fecha)}</p>
                <p><strong>⏰ Hora:</strong> ${escapeHtml(hora)}</p>
                <p><strong>📂 Tipo:</strong> ${cita.tipo ? cita.tipo.replace(/_/g, " ").toLowerCase() : ""}</p>
                <span class="tag">${cita.estado ? cita.estado.replace(/_/g, " ") : ""}</span>
            </div>

            ${cita.estado === "ATENDIDA" ? `
                <button class="btn-pagos" onclick="verPagos(${cita.idCitas || cita.id || 0})">
                    Ver Pagos
                </button>` : ``}
        `;

        contenedor.appendChild(card);
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function verPagos(idCita) {
    if (!idCita) return;
    window.location.href =
        `../dashboard-psicologo-pagos/pagos-psicologo.html?id=${idCita}`;
}

export { mostrarCitas };
