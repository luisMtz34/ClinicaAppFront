document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idCita = urlParams.get("idCita");

    const modal = document.getElementById("modalPago");
    const form = document.getElementById("formPago");
    const listaPagos = document.getElementById("listaPagos");
    const btnCancelar = document.getElementById("btnCancelar");

    const token = localStorage.getItem("accessToken");

    if (!token) {
        alert("No se encontró el token. Inicia sesión nuevamente.");
        window.location.href = "/login.html";
        return;
    }

    // Mostrar el modal al cargar
    modal.style.display = "block";

    //Autollenar campos por defecto
    form.montoTotal.value = 500;
    form.motivo.value = "Cita atendida";

    btnCancelar.addEventListener("click", () => {
        modal.style.display = "none";
        cargarPagos();
    });

    // 🧾 Evento para registrar pago
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const datos = Object.fromEntries(new FormData(form).entries());
        datos.citaId = parseInt(idCita);
        datos.penalizacion = parseFloat(datos.penalizacion || 0);


        try {
            // 1️⃣ Registrar el pago
            const resp = await fetch("http://localhost:8082/pagos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(datos)
            });

            if (!resp.ok) {
                const error = await resp.text();
                console.error("Error al registrar pago:", error);
                alert("Error al registrar pago: " + error);
                return;
            }

            // 2️⃣ Cambiar estado de la cita a ATENDIDA
            const actualizarEstado = await fetch(`http://localhost:8082/citas/${idCita}/estado?estado=ATENDIDA`, {
                method: "PUT",
                headers: { "Authorization": "Bearer " + token }
            });

            if (!actualizarEstado.ok) {
                console.warn("⚠️ El pago se registró, pero no se pudo actualizar el estado de la cita.");
            }

            // 3️⃣ Confirmación
            alert("✅ Pago registrado correctamente y cita marcada como atendida.");

            modal.style.display = "none";
            await cargarPagos();

            // 4️⃣ Redirigir al calendario o dashboard
            //setTimeout(() => {
            //  window.location.href = "../dashboard-secretaria/home-secretaria.html";
            //}, 1000);

        } catch (err) {
            console.error("Error al conectar con el servidor:", err);
        }
    });

    async function cargarPagos() {
        try {
            const resp = await fetch(`http://localhost:8082/pagos/cita/${idCita}`, {
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            if (resp.status === 403) {
                alert("⚠️ No tienes permisos para ver estos pagos (solo la secretaria puede hacerlo).");
                return;
            }

            if (!resp.ok) {
                console.error("Error HTTP:", resp.status);
                return;
            }

            const pagos = await resp.json();

            listaPagos.innerHTML = `
  <h3>Pagos registrados</h3>
  <table border="1">
    <thead>
      <tr>
        <th>Paciente</th>
        <th>Psicólogo</th>
        <th>Monto</th>
        <th>Penalización</th>
        <th>Fecha y Hora</th>
        <th>Motivo</th>
        <th>Tipo de Pago</th>
        <th>Observaciones</th>
      </tr>
    </thead>
    <tbody>
      ${pagos.map(p => `
        <tr>
          <td>${p.nombrePaciente || '-'}</td>
          <td>${p.nombrePsicologo || '-'}</td>
          <td>$${p.montoTotal}</td>
          <td>${p.penalizacion ? `$${p.penalizacion}` : '-'}</td>
          <td>${p.fechaCita} ${p.horaCita}</td>
          <td>${p.motivo || '-'}</td>
          <td>${p.tipoPago}</td>
          <td>${p.observaciones || '-'}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
`;

        } catch (err) {
            console.error("Error al cargar pagos:", err);
        }
    }

    await cargarPagos();
});
