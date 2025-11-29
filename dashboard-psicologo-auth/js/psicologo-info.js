function cargarNombrePsicologo() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        document.getElementById("nombrePsicologo").textContent = "Bienvenido";
        return;
    }
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const nombre = (payload.nombre || "") + " " + (payload.apellido || "");
        document.getElementById("nombrePsicologo")
            .textContent = `Bienvenido, ${nombre}`.trim();
    } catch {
        document.getElementById("nombrePsicologo").textContent = "Bienvenido";
    }
}

export { cargarNombrePsicologo };
