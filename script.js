async function cargarZapatillas() {
    const res = await fetch("http://localhost:3000/zapatillas");
    const zapatillas = await res.json();

    const tbody = document.querySelector("#inventario tbody");
    tbody.innerHTML = "";

    zapatillas.forEach(z => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${z.marca}</td>
            <td>${z.modelo}</td>
            <td>${z.talla}</td>
            <td>${z.color}</td>
            <td>${z.stock}</td>
            <td>$${z.precio}</td>
        `;
        tbody.appendChild(fila);
    });
}


cargarZapatillas();
