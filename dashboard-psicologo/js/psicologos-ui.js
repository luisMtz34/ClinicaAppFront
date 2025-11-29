// psicologos-ui.js

export function pintarPsicologos(lista) {
  const tbody = document.querySelector("#tablaPsicologos tbody");
  tbody.innerHTML = "";

  lista.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.nombre}</td>
      <td>${p.email}</td>
      <td>${p.telefono}</td>
      <td>
        <button class="btnEditar" data-id="${p.id}">Editar</button>
        <button class="btnEliminar" data-id="${p.id}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

export function abrirModal(psicologo) {
  document.getElementById("editId").value = psicologo.id;
  document.getElementById("editNombre").value = psicologo.nombre;
  document.getElementById("editEmail").value = psicologo.email;
  document.getElementById("editTelefono").value = psicologo.telefono;

  const modal = document.getElementById("modalEditar");
  modal.style.display = "flex";
}

export function cerrarModal() {
  const modal = document.getElementById("modalEditar");
  modal.style.display = "none";

  document.getElementById("formEditarPsicologo").reset();
}
