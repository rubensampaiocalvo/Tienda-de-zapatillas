const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname)));


const db = mysql.createConnection({
    host: "localhost",
    user: "root",        // Usuario
    password: "", // Contraseña de la base de datos
    database: "sistema_chatia" // el nommbre de la base de datos 
});

db.connect(err => {
    if(err) console.error("Error al conectar a MySQL:", err);
    else console.log("Conectado a MySQL");
});


app.get("/zapatillas", (req, res) => {
    db.query("SELECT * FROM zapatillas", (err, results) => {
        if(err) return res.status(500).json({ error: err });
        res.json(results);
    });
});


const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
