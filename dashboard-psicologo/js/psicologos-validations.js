// psicologos-validations.js

export function validarPsicologo({ nombre, email, password, telefono }) {
  const regexNombre = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ ]{3,}$/;
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const regexTelefono = /^[0-9]{10}$/;

  if (!regexNombre.test(nombre))
    return "El nombre debe tener mínimo 3 letras y solo contener letras y espacios.";

  if (!regexEmail.test(email))
    return "Ingresa un correo electrónico válido.";

  if (password && password.length < 6)
    return "La contraseña debe tener al menos 6 caracteres.";

  if (!regexTelefono.test(telefono))
    return "El teléfono debe contener 10 dígitos.";

  return null; // válido
}
