document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formSecretaria");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Obtener valores
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const turno = document.getElementById("turno").value;

    // ================================
    // VALIDACIONES
    // ================================

    // Validar nombre (solo letras y espacios, mínimo 3 caracteres)
    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,60}$/;
    if (!regexNombre.test(nombre)) {
      Swal.fire({
        icon: "warning",
        title: "Nombre inválido",
        text: "El nombre debe contener solo letras y tener al menos 3 caracteres."
      });
      return;
    }

    // Validar correo
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
      Swal.fire({
        icon: "warning",
        title: "Correo inválido",
        text: "Ingresa un correo electrónico válido."
      });
      return;
    }

    // Validar contraseña
    if (password.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Contraseña demasiado corta",
        text: "La contraseña debe tener al menos 6 caracteres."
      });
      return;
    }

    // Validar teléfono (opcional, pero si se escribe debe ser válido)
    const regexTel = /^[0-9]{10}$/;
    if (telefono && !regexTel.test(telefono)) {
      Swal.fire({
        icon: "warning",
        title: "Teléfono inválido",
        text: "El teléfono debe contener 10 dígitos numéricos."
      });
      return;
    }

    if (!turno) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona un turno",
        text: "El turno es obligatorio."
      });
      return;
    }

    // Datos a enviar
    const data = { nombre, email, password, telefono, turno };

    // ================================
    // TOKEN
    // ================================
    const token = localStorage.getItem("accessToken");

    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Sin autenticación",
        text: "No tienes sesión iniciada. Inicia sesión nuevamente."
      });
      return;
    }

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/admin/registrar-secretaria`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error al registrar secretaria");
      }

      const result = await response.json();

      Swal.fire({
        icon: "success",
        title: "Registrada correctamente",
        text: `La secretaria ${result.nombre} fue registrada exitosamente.`,
        confirmButtonText: "Aceptar"
      });

      form.reset();

    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo registrar la secretaria. Revisa el servidor."
      });
    }
  });

  // Botón volver
  document.getElementById("btnVolver").addEventListener("click", () => {
    window.history.back();
  });
});
