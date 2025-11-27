const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('error');

// Función para extraer el rol desde el JWT
function obtenerRolDesdeToken(token) {
  if (!token) return null;
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    return payload.rol;
  } catch (err) {
    console.error("Error leyendo JWT", err);
    return null;
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/acceder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });


    if (!response.ok) throw new Error("Error en login");

    const data = await response.json();

    const token = data.accessToken;
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", data.refreshToken);

    const rol = obtenerRolDesdeToken(token);

    // Redireccionar según rol
    if (rol === "SECRETARIA") {
      window.location.href = "/dashboard-secretaria/home-secretaria.html";
    } else if (rol === "PSICOLOGO") {
      window.location.href = "/dashboard-psicologo-auth/home-psicologo.html";
    } else if (rol === "ADMIN") {
      window.location.href = "/dashboard-admin/admin.html";
    } else {
      alert("Rol no reconocido ❌");
    }

  } catch (err) {
    errorMessage.style.display = "block";
    errorMessage.innerText = "Credenciales inválidas ❌";
    console.error(err);
  }
});
