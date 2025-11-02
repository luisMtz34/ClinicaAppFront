const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('error');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch("http://localhost:8082/auth/acceder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: password,
        rol: "SECRETARIA" 
      })
    });

    if (!response.ok) throw new Error("Error en login");

    const data = await response.json();
    

    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    window.location.href = "/dashboard-secretaria/home-secretaria.html"; 
  } catch (err) {
    errorMessage.style.display = "block";
      errorMessage.innerText = "Credenciales inválidas ❌";
  }
});
