
const zapatillas = [
    { marca: "Nike", modelo: "Air Max", talla: 42, color: "Blanco", stock: 10, precio: 120 },
    { marca: "Adidas", modelo: "Ultraboost", talla: 40, color: "Negro", stock: 5, precio: 150 },
    { marca: "Puma", modelo: "RS-X", talla: 41, color: "Rojo", stock: 7, precio: 100 }
];


function mostrarInventario() {
    const tbody = document.querySelector("#inventario tbody");
    tbody.innerHTML = ""; 

    zapatillas.forEach(zapatilla => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${zapatilla.marca}</td>
            <td>${zapatilla.modelo}</td>
            <td>${zapatilla.talla}</td>
            <td>${zapatilla.color}</td>
            <td>${zapatilla.stock}</td>
            <td>$${zapatilla.precio}</td>
        `;
        tbody.appendChild(fila);
    });
}


mostrarInventario();
