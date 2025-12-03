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
    user: "root",        
    password: "", 
    database: "sistema_chatia"
});

db.connect(err => {
    if(err) console.error("Error al conectar a MySQL:", err);
    else console.log("Conectado a MySQL");
});

// Ruta para zapatillas
app.get("/zapatillas", (req, res) => {
    const query = `
        SELECT 
            nombre as modelo,
            precio,
            descripcion,
            stock,
            categoria as marca,
            'N/A' as talla,
            'N/A' as color
        FROM producto
    `;
    
    db.query(query, (err, results) => {
        if(err) {
            console.error("Error en consulta:", err);
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

// Ruta para login
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    
    const query = "SELECT * FROM usuario WHERE email = ? AND contraseña = ?";
    
    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error("Error en login:", err);
            return res.status(500).json({ error: "Error del servidor" });
        }
        
        if (results.length > 0) {
            const usuario = results[0];
            // Eliminar la contraseña del objeto de respuesta por seguridad
            delete usuario.contraseña;
            res.json({ 
                success: true, 
                usuario: usuario,
                message: "Login exitoso"
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: "Email o contraseña incorrectos" 
            });
        }
    });
});

// Ruta para registro
app.post("/registro", (req, res) => {
    const { nombre, email, password, direccion } = req.body;
    
    // Verificar si el usuario ya existe
    const checkQuery = "SELECT * FROM usuario WHERE email = ?";
    
    db.query(checkQuery, [email], (err, results) => {
        if (err) {
            console.error("Error verificando usuario:", err);
            return res.status(500).json({ error: "Error del servidor" });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "El email ya está registrado" 
            });
        }
        
        // Insertar nuevo usuario
        const insertQuery = `
            INSERT INTO usuario (nombre, email, contraseña, direccion, rol) 
            VALUES (?, ?, ?, ?, 'cliente')
        `;
        
        db.query(insertQuery, [nombre, email, password, direccion || ''], (err, results) => {
            if (err) {
                console.error("Error registrando usuario:", err);
                return res.status(500).json({ error: "Error del servidor" });
            }
            
            res.json({ 
                success: true, 
                message: "Usuario registrado exitosamente",
                usuario: {
                    id_usuario: results.insertId,
                    nombre: nombre,
                    email: email,
                    direccion: direccion || '',
                    rol: 'cliente'
                }
            });
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));