const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Middleware de logs
app.use((req, res, next) => {
    console.log(`📦 ${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
    next();
});

// Conexión a MySQL
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
        process.exit(1);
    } else {
        console.log("✅ Conectado a MySQL - Base de datos: sistema_chatia");
        
        // Verificar tablas
        db.query("SHOW TABLES", (err, results) => {
            if(err) {
                console.error("Error al ver tablas:", err);
            } else {
                console.log("📊 Tablas disponibles:", results.map(r => Object.values(r)[0]));
            }
        });
    }
});

// ========== RUTAS PRINCIPALES ==========

// Ruta PRINCIPAL para servir el index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
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
            // Verificar estructura de tablas importantes
            const tableChecks = [
                "SHOW TABLES LIKE 'usuario'",
                "SHOW TABLES LIKE 'producto'",
                "SHOW TABLES LIKE 'carrito'"
            ];
            
            Promise.all(tableChecks.map(query => 
                new Promise(resolve => {
                    db.query(query, (err, result) => resolve({query, result: result.length > 0}));
                })
            )).then(results => {
                const tables = {
                    usuario: results[0].result,
                    producto: results[1].result,
                    carrito: results[2].result
                };
                
                res.json({ 
                    status: "ok", 
                    message: "Servidor y base de datos funcionando",
                    tables: tables
                });
            });
        }
    });
});

// ========== RUTAS DE PRODUCTOS ==========

// Ruta para TODOS los productos (alias de /api/zapatillas)
app.get("/api/productos", (req, res) => {
    console.log("📦 Consultando TODOS los productos...");
    
    const query = `
        SELECT 
            id_producto,
            nombre as modelo,
            precio,
            descripcion,
            stock,
            categoria as marca,
            'zapatilla' as tipo
        FROM producto
        ORDER BY nombre ASC
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

// Ruta para zapatillas (igual que productos)
app.get("/api/zapatillas", (req, res) => {
    console.log("🔍 Consultando productos/zapatillas...");
    
    const query = `
        SELECT 
            id_producto,
            nombre as modelo,
            precio,
            descripcion,
            stock,
            categoria as marca,
            'zapatilla' as tipo
        FROM producto
        ORDER BY id_producto DESC
    `;
    
    db.query(query, (err, results) => {
        if(err) {
            console.error("❌ Error en consulta de productos:", err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log(`✅ ${results.length} zapatillas encontradas`);
        res.json(results);
    });
});

// Ruta para productos por categoría
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
        WHERE LOWER(categoria) = LOWER(?)
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

// Ruta para buscar productos
app.get("/api/productos/buscar/:termino", (req, res) => {
    const termino = `%${req.params.termino}%`;
    console.log(`🔍 Buscando productos con término: ${termino}`);
    
    const query = `
        SELECT 
            id_producto,
            nombre as modelo,
            precio,
            descripcion,
            stock,
            categoria as marca
        FROM producto
        WHERE 
            nombre LIKE ? OR
            descripcion LIKE ? OR
            categoria LIKE ?
        ORDER BY nombre ASC
    `;
    
    db.query(query, [termino, termino, termino], (err, results) => {
        if(err) {
            console.error("❌ Error en búsqueda:", err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log(`🔍 ${results.length} productos encontrados para búsqueda`);
        res.json(results);
    });
});

// ========== RUTAS DE USUARIOS ==========

// Ruta para login
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    console.log(`🔑 Intento de login: ${email}`);
    
    // Buscar usuario por email
    const query = `
        SELECT 
            id_usuario,
            nombre,
            email,
            direccion,
            rol,
            fecha_registro
        FROM usuario 
        WHERE email = ? AND contraseña = ?
    `;
    
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
        
        // Insertar nuevo usuario
        const insertQuery = `
            INSERT INTO usuario (nombre, email, contraseña, direccion, rol) 
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
            
            // Obtener el usuario recién creado
            const usuarioQuery = "SELECT id_usuario, nombre, email, direccion, rol FROM usuario WHERE id_usuario = ?";
            db.query(usuarioQuery, [results.insertId], (err, usuarioResult) => {
                if (err) {
                    console.error("❌ Error obteniendo usuario:", err.message);
                    return res.status(500).json({ 
                        success: false, 
                        message: "Usuario creado pero error al obtener datos" 
                    });
                }
                
                res.json({ 
                    success: true, 
                    message: "Usuario registrado exitosamente",
                    usuario: usuarioResult[0]
                });
            });
        });
    });
});

// ========== RUTAS DE CARRITO ==========

// Ruta para obtener productos del carrito
app.get("/api/carrito/:usuarioId", (req, res) => {
    const usuarioId = req.params.usuarioId;
    console.log(`🛒 Consultando carrito para usuario ID: ${usuarioId}`);
    
    const query = `
        SELECT 
            p.id_producto,
            p.nombre as modelo,
            p.precio,
            p.descripcion,
            p.categoria as marca,
            c.cantidad,
            c.fecha_agregado
        FROM carrito c 
        JOIN producto p ON c.id_producto = p.id_producto 
        WHERE c.id_usuario = ?
        ORDER BY c.fecha_agregado DESC
    `;
    
    db.query(query, [usuarioId], (err, results) => {
        if(err) {
            console.error("❌ Error obteniendo carrito:", err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log(`🛒 ${results.length} productos en el carrito`);
        res.json(results);
    });
});

// Ruta para agregar producto al carrito
app.post("/api/carrito/agregar", (req, res) => {
    const { usuarioId, productoId, cantidad = 1 } = req.body;
    console.log(`➕ Agregando producto ${productoId} al carrito de usuario ${usuarioId}`);
    
    // Verificar si el producto ya está en el carrito
    const checkQuery = "SELECT * FROM carrito WHERE id_usuario = ? AND id_producto = ?";
    
    db.query(checkQuery, [usuarioId, productoId], (err, results) => {
        if(err) {
            console.error("❌ Error verificando carrito:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if(results.length > 0) {
            // Actualizar cantidad si ya existe
            const updateQuery = "UPDATE carrito SET cantidad = cantidad + ? WHERE id_usuario = ? AND id_producto = ?";
            db.query(updateQuery, [cantidad, usuarioId, productoId], (err) => {
                if(err) {
                    console.error("❌ Error actualizando carrito:", err.message);
                    return res.status(500).json({ success: false, error: err.message });
                }
                console.log("✅ Cantidad actualizada en carrito");
                res.json({ success: true, message: "Cantidad actualizada" });
            });
        } else {
            // Insertar nuevo registro
            const insertQuery = "INSERT INTO carrito (id_usuario, id_producto, cantidad) VALUES (?, ?, ?)";
            db.query(insertQuery, [usuarioId, productoId, cantidad], (err) => {
                if(err) {
                    console.error("❌ Error agregando al carrito:", err.message);
                    return res.status(500).json({ success: false, error: err.message });
                }
                console.log("✅ Producto agregado al carrito");
                res.json({ success: true, message: "Producto agregado al carrito" });
            });
        }
    });
});

// Ruta para eliminar producto del carrito
app.delete("/api/carrito/eliminar", (req, res) => {
    const { usuarioId, productoId } = req.body;
    console.log(`➖ Eliminando producto ${productoId} del carrito de usuario ${usuarioId}`);
    
    const query = "DELETE FROM carrito WHERE id_usuario = ? AND id_producto = ?";
    
    db.query(query, [usuarioId, productoId], (err, results) => {
        if(err) {
            console.error("❌ Error eliminando del carrito:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if(results.affectedRows > 0) {
            console.log("✅ Producto eliminado del carrito");
            res.json({ success: true, message: "Producto eliminado del carrito" });
        } else {
            res.status(404).json({ success: false, message: "Producto no encontrado en el carrito" });
        }
    });
});

// ========== RUTAS DE ARCHIVOS ESTÁTICOS ==========

// Ruta para servir archivos HTML
app.get("/:page", (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, `${page}.html`);
    
    // Verificar si el archivo existe
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        // Redirigir al index si no existe
        res.sendFile(path.join(__dirname, "index.html"));
    }
});

// Middleware para manejar 404
app.use((req, res) => {
    console.log(`❌ Ruta no encontrada: ${req.method} ${req.url}`);
    res.status(404).json({ 
        success: false, 
        message: "Ruta no encontrada",
        available_routes: {
            productos: ["GET /api/productos", "GET /api/zapatillas", "GET /api/productos/categoria/:categoria"],
            usuarios: ["POST /api/login", "POST /api/registro"],
            carrito: ["GET /api/carrito/:usuarioId", "POST /api/carrito/agregar", "DELETE /api/carrito/eliminar"],
            status: "GET /api/status"
        }
    });
});

// ========== INICIAR SERVIDOR ==========

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🔗 Endpoints disponibles:`);
    console.log(`   📁 GET  http://localhost:${PORT}/ (Página principal)`);
    console.log(`   📊 GET  http://localhost:${PORT}/api/status (Estado del servidor)`);
    console.log(`   👟 GET  http://localhost:${PORT}/api/zapatillas (Todos los productos)`);
    console.log(`   📦 GET  http://localhost:${PORT}/api/productos (Todos los productos)`);
    console.log(`   🏷️ GET  http://localhost:${PORT}/api/productos/categoria/:categoria (Filtrar por categoría)`);
    console.log(`   🔍 GET  http://localhost:${PORT}/api/productos/buscar/:termino (Buscar productos)`);
    console.log(`   🔑 POST http://localhost:${PORT}/api/login (Iniciar sesión)`);
    console.log(`   📝 POST http://localhost:${PORT}/api/registro (Registrarse)`);
    console.log(`   🛒 GET  http://localhost:${PORT}/api/carrito/:usuarioId (Ver carrito)`);
    console.log(`   ➕ POST http://localhost:${PORT}/api/carrito/agregar (Agregar al carrito)`);
    console.log(`   ➖ DELETE http://localhost:${PORT}/api/carrito/eliminar (Eliminar del carrito)`);
    console.log(`\n📁 Archivos estáticos servidos desde: ${__dirname}`);
});

