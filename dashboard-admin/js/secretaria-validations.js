// secretaria-validations.js
export function validarSecretaria({ nombre, email, password, telefono, turno }) {
  const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,60}$/;
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const regexTel = /^[0-9]{10}$/;

  if (!regexNombre.test(nombre)) return "Nombre inválido: usa solo letras y espacios (mínimo 3 caracteres).";
  if (!regexEmail.test(email)) return "Correo inválido: ingresa un correo válido.";
  if (password.length < 6) return "Contraseña demasiado corta: mínimo 6 caracteres.";
  if (telefono && !regexTel.test(telefono)) return "Teléfono inválido: debe tener 10 dígitos numéricos.";
  if (!turno) return "Selecciona un turno.";

  return null; // Todo ok
}
