function validarSesion() {
    if (!localStorage.getItem("accessToken")) {
        window.location.href = "login.html";
    }
}

function iniciarLogout() {
    document.getElementById("logoutBtn").addEventListener("click", () => {
        Swal.fire({
            title: "¿Cerrar sesión?",
            text: "Tu sesión actual se cerrará.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, cerrar sesión",
            cancelButtonText: "Cancelar"
        }).then(result => {
            if (result.isConfirmed) {
                localStorage.removeItem("accessToken");

                Swal.fire({
                    title: "Sesión cerrada",
                    text: "Serás redirigido al login.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });

                setTimeout(() => {
                    window.location.href = "../index.html";
                }, 1500);
            }
        });
    });
}

export { validarSesion, iniciarLogout };
