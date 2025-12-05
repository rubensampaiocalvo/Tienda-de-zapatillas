const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));


app.use((req, res, next) => {
    console.log(`📦 ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    next();
});

const db = mysql.createConnection({
    host: "localhost",
    user: "root",        
    password: "", 
    database: "sistema_chatia"
});

db.connect(err => {
    if(err) {
        console.error("❌ Error al conectar a MySQL:", err.message);
        console.log("⚠️  Verifica que:");
        console.log("   1. XAMPP/WAMP está corriendo (MySQL en verde)");
        console.log("   2. La base de datos 'sistema_chatia' existe");
        console.log("   3. El usuario 'root' no tiene contraseña");
    } else {
        console.log("✅ Conectado a MySQL - Base de datos: sistema_chatia");
        
        // Verificar tablas
        db.query("SHOW TABLES", (err, results) => {
            if(err) console.error("Error al ver tablas:", err);
            else console.log("📊 Tablas disponibles:", results.map(r => Object.values(r)[0]));
        });
    }
});

// Ruta PRINCIPAL para servir el index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Ruta para servir cualquier archivo HTML que necesites
app.get("/:page", (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, `${page}.html`);
    
    // Verificar si el archivo existe
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        
        res.sendFile(path.join(__dirname, "index.html"));
    }
});

// Ruta para verificar conexión
app.get("/api/status", (req, res) => {
    db.query("SELECT 1 as connection_test", (err, results) => {
        if(err) {
            res.json({ 
                status: "error", 
                message: "Error en base de datos",
                error: err.message 
            });
        } else {
            res.json({ 
                status: "ok", 
                message: "Servidor y base de datos funcionando",
                tables: ["usuario", "producto", "carrito", "pedido", "detallegedido", "chatia"]
            });
        }
    });
});

// Ruta para zapatillas
app.get("/api/zapatillas", (req, res) => {
    console.log("🔍 Consultando productos...");
    
    // Primero verifica si la tabla producto existe
    db.query("SHOW COLUMNS FROM producto", (err, columns) => {
        if(err) {
            console.error("❌ Error al obtener columnas de 'producto':", err.message);
            return res.status(500).json({ 
                error: "Tabla 'producto' no encontrada",
                suggestion: "Crea la tabla producto o verifica el nombre" 
            });
        }
        
        console.log("📋 Columnas de 'producto':", columns.map(c => c.Field));
        
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
                console.error("❌ Error en consulta de productos:", err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log(`✅ ${results.length} productos encontrados`);
            res.json(results);
        });
    });
});

// Ruta para login
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    console.log(`🔑 Intento de login: ${email}`);
    
    // Primero verifica la estructura de la tabla usuario
    db.query("SHOW COLUMNS FROM usuario", (err, columns) => {
        if(err) {
            console.error("❌ Error al obtener columnas de 'usuario':", err.message);
            return res.status(500).json({ 
                success: false, 
                message: "Error en la base de datos" 
            });
        }
        
        console.log("📋 Columnas de 'usuario':", columns.map(c => c.Field));
        
        // Busca el nombre correcto de la columna de contraseña
        const passwordColumn = columns.find(c => 
            c.Field.toLowerCase().includes('contraseña') || 
            c.Field.toLowerCase().includes('contrasena') ||
            c.Field.toLowerCase().includes('password')
        );
        
        const passwordField = passwordColumn ? passwordColumn.Field : 'contraseña';
        console.log(`🔑 Usando columna de contraseña: ${passwordField}`);
        
        const query = `SELECT * FROM usuario WHERE email = ? AND ${passwordField} = ?`;
        
        db.query(query, [email, password], (err, results) => {
            if (err) {
                console.error("❌ Error en login:", err.message);
                return res.status(500).json({ 
                    success: false, 
                    message: "Error del servidor" 
                });
            }
            
            if (results.length > 0) {
                const usuario = results[0];
                console.log(`✅ Login exitoso para: ${usuario.nombre}`);
                
                // Eliminar la contraseña del objeto de respuesta
                delete usuario[passwordField];
                delete usuario.contraseña;
                delete usuario.contrasena;
                
                res.json({ 
                    success: true, 
                    usuario: usuario,
                    message: "Login exitoso"
                });
            } else {
                console.log("❌ Login fallido: credenciales incorrectas");
                res.status(401).json({ 
                    success: false, 
                    message: "Email o contraseña incorrectos" 
                });
            }
        });
    });
});

// Ruta para registro
app.post("/api/registro", (req, res) => {
    const { nombre, email, password, direccion } = req.body;
    console.log(`📝 Registro solicitado para: ${email}`);
    
    // Verificar si el usuario ya existe
    const checkQuery = "SELECT * FROM usuario WHERE email = ?";
    
    db.query(checkQuery, [email], (err, results) => {
        if (err) {
            console.error("❌ Error verificando usuario:", err.message);
            return res.status(500).json({ 
                success: false, 
                message: "Error del servidor" 
            });
        }
        
        if (results.length > 0) {
            console.log("❌ Email ya registrado:", email);
            return res.status(400).json({ 
                success: false, 
                message: "El email ya está registrado" 
            });
        }
        
        // Verificar columnas disponibles para insertar
        db.query("SHOW COLUMNS FROM usuario", (err, columns) => {
            if(err) {
                console.error("❌ Error al obtener columnas:", err.message);
                return res.status(500).json({ error: "Error en base de datos" });
            }
            
            const columnNames = columns.map(c => c.Field);
            console.log("📋 Columnas disponibles:", columnNames);
            
            // Determinar el nombre de la columna de contraseña
            const passwordColumn = columns.find(c => 
                c.Field.toLowerCase().includes('contraseña') || 
                c.Field.toLowerCase().includes('contrasena')
            );
            
            const passwordField = passwordColumn ? passwordColumn.Field : 'contraseña';
            
            // Insertar nuevo usuario
            const insertQuery = `
                INSERT INTO usuario (nombre, email, ${passwordField}, direccion, rol) 
                VALUES (?, ?, ?, ?, 'cliente')
            `;
            
            db.query(insertQuery, [nombre, email, password, direccion || ''], (err, results) => {
                if (err) {
                    console.error("❌ Error registrando usuario:", err.message);
                    return res.status(500).json({ 
                        success: false, 
                        message: "Error del servidor" 
                    });
                }
                
                console.log(`✅ Usuario registrado: ${nombre} (ID: ${results.insertId})`);
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
});

// Ruta para obtener productos del carrito
app.get("/api/carrito/:usuarioId", (req, res) => {
    const usuarioId = req.params.usuarioId;
    
    const query = `
        SELECT p.*, c.cantidad 
        FROM carrito c 
        JOIN producto p ON c.id_producto = p.id_producto 
        WHERE c.id_usuario = ?
    `;
    
    db.query(query, [usuarioId], (err, results) => {
        if(err) {
            console.error("❌ Error obteniendo carrito:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});


app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "index.html"));
});

// Ruta para obtener TODOS los productos
app.get("/api/productos", (req, res) => {
    console.log("📦 Consultando TODOS los productos...");
    
    const query = `
        SELECT 
            id_producto,
            nombre as modelo,
            precio,
            descripcion,
            stock,
            categoria as marca
        FROM producto
        ORDER BY id_producto DESC
    `;
    
    db.query(query, (err, results) => {
        if(err) {
            console.error("❌ Error en consulta productos:", err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log(`✅ ${results.length} productos encontrados`);
        res.json(results);
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🔗 Endpoints disponibles:`);
    console.log(`   GET  http://localhost:${PORT}/ (Página principal)`);
    console.log(`   GET  http://localhost:${PORT}/api/status`);
    console.log(`   GET  http://localhost:${PORT}/api/zapatillas`);
    console.log(`   POST http://localhost:${PORT}/api/login`);
    console.log(`   POST http://localhost:${PORT}/api/registro`);
    console.log(`\n📁 Archivos estáticos servidos desde: ${__dirname}`);
});

// Ruta para obtener TODOS los productos
app.get("/api/productos", (req, res) => {
    console.log("📦 Consultando todos los productos...");
    
    const query = `
        SELECT 
            id_producto,
            nombre as modelo,
            precio,
            descripcion,
            stock,
            categoria as marca,
            'N/A' as talla,
            'N/A' as color
        FROM producto
        ORDER BY id_producto DESC
    `;
    
    db.query(query, (err, results) => {
        if(err) {
            console.error("❌ Error en consulta productos:", err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log(`✅ ${results.length} productos encontrados`);
        res.json(results);
    });
});

// Ruta para obtener productos por categoría
app.get("/api/productos/categoria/:categoria", (req, res) => {
    const categoria = req.params.categoria;
    console.log(`🏷️ Consultando productos de categoría: ${categoria}`);
    
    const query = `
        SELECT 
            id_producto,
            nombre as modelo,
            precio,
            descripcion,
            stock,
            categoria as marca
        FROM producto
        WHERE categoria = ?
        ORDER BY nombre ASC
    `;
    
    db.query(query, [categoria], (err, results) => {
        if(err) {
            console.error("❌ Error en consulta por categoría:", err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log(`🏷️ ${results.length} productos en categoría ${categoria}`);
        res.json(results);
    });
});

