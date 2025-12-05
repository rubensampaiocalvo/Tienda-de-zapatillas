class Newshoes {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.productos = [];
        this.todosProductos = []; 
        this.carrito = [];
        this.usuario = null;
        
        console.log('🚀 Newshoes inicializado');
        this.verificarSesion();
        this.iniciar();
    }

    async iniciar() {
        await this.cargarProductos();
        this.mostrarProductos();
        this.configurarEventos();
        
        this.verificarConexion();
    }

    async verificarConexion() {
        try {
            const respuesta = await fetch(`${this.apiUrl}/status`);
            const datos = await respuesta.json();
            
            if (datos.status === "ok") {
                console.log('✅ Servidor conectado correctamente');
            } else {
                console.error('❌ Error del servidor:', datos.message);
                this.mostrarMensaje('Error de conexión con el servidor', 'error');
            }
        } catch (error) {
            console.error('❌ No se pudo conectar al servidor:', error);
            this.mostrarMensaje('Error de conexión. Verifica que el servidor esté corriendo en localhost:3000', 'error');
        }
    }

    verificarSesion() {
        const usuarioGuardado = localStorage.getItem('usuario_newshoes');
        if (usuarioGuardado) {
            this.usuario = JSON.parse(usuarioGuardado);
            this.actualizarHeader();
            console.log('👤 Usuario en sesión:', this.usuario.nombre);
        }
    }

    async cargarTodosProductos() {
    try {
        console.log('📦 Cargando TODOS los productos desde API...');
        const respuesta = await fetch(`${this.apiUrl}/productos`);
        
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        
        const datos = await respuesta.json();
        
        if (datos.error) {
            throw new Error(datos.error);
        }
        
        this.todosProductos = datos;
        console.log(`✅ ${this.todosProductos.length} productos totales cargados`);
        
    } catch (error) {
        console.error('❌ Error cargando todos los productos:', error);
        this.mostrarError(`No se pudieron cargar todos los productos: ${error.message}`);
    }
}

    async cargarProductos() {
        try {
            console.log('📦 Cargando productos desde:', `${this.apiUrl}/zapatillas`);
            const respuesta = await fetch(`${this.apiUrl}/zapatillas`);
            
            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            }
            
            const datos = await respuesta.json();
            
            if (datos.error) {
                throw new Error(datos.error);
            }
            
            this.productos = datos;
            console.log(`✅ ${this.productos.length} productos cargados`);
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.mostrarError(`No se pudieron cargar los productos: ${error.message}`);
        }
    }

    mostrarProductos() {
        const contenedor = document.getElementById('grid-productos');
        
        if (!contenedor) {
            console.error('❌ No se encontró el contenedor de productos');
            return;
        }

        if (!this.productos || this.productos.length === 0) {
            contenedor.innerHTML = '<p class="no-productos">No hay productos disponibles</p>';
            return;
        }

        contenedor.innerHTML = this.productos.map(producto => `
            <div class="producto-card">
                <div class="producto-imagen">
                    <div class="imagen-placeholder">👟</div>
                </div>
                <div class="producto-info">
                    <h3 class="producto-marca">${producto.marca || producto.categoria || 'Marca'}</h3>
                    <h4 class="producto-modelo">${producto.modelo || producto.nombre || 'Producto'}</h4>
                    <p class="producto-descripcion">${producto.descripcion || 'Zapatilla de alta calidad'}</p>
                    <div class="producto-precio">€${producto.precio || '0.00'}</div>
                    <div class="producto-stock">Stock: ${producto.stock || 0}</div>
                    <button class="btn-agregar" data-id="${producto.id_producto || producto.id || '1'}" 
                            data-modelo="${producto.modelo || producto.nombre}" 
                            data-precio="${producto.precio}">
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        `).join('');
    }

    configurarEventos() {
        console.log('🔧 Configurando eventos...');
        
        const btnLogin = document.querySelector('.btn-login');
        if (btnLogin) {
            btnLogin.addEventListener('click', () => {
                console.log('👤 Click en login');
                this.mostrarModal('modalLogin');
            });
        }

        const btnCarrito = document.querySelector('.btn-carrito');
        if (btnCarrito) {
            btnCarrito.addEventListener('click', () => {
                console.log('🛒 Click en carrito');
                this.mostrarCarrito();
            });
        }

        const btnColeccion = document.querySelector('.btn-primary');
        if (btnColeccion) {
            btnColeccion.addEventListener('click', () => {
                const productosSection = document.querySelector('#productos');
                if (productosSection) {
                    productosSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        const buscador = document.getElementById('buscador');
        if (buscador) {
            buscador.addEventListener('input', (e) => {
                this.buscarProductos(e.target.value);
            });
        }

        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.cerrarModales();
            });
        });

        const linkRegistro = document.getElementById('showRegister');
        if (linkRegistro) {
            linkRegistro.addEventListener('click', (e) => {
                e.preventDefault();
                this.mostrarModal('modalRegister');
            });
        }

        const formLogin = document.getElementById('loginForm');
        if (formLogin) {
            formLogin.addEventListener('submit', (e) => {
                e.preventDefault();
                this.iniciarSesion();
            });
        }

        const formRegistro = document.getElementById('registerForm');
        if (formRegistro) {
            formRegistro.addEventListener('submit', (e) => {
                e.preventDefault();
                this.registrarUsuario();
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.cerrarModales();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-agregar')) {
                const id = e.target.getAttribute('data-id');
                const modelo = e.target.getAttribute('data-modelo');
                const precio = e.target.getAttribute('data-precio');
                this.agregarAlCarrito(id, modelo, precio);
            }
        });

        console.log('✅ Eventos configurados');
    }

    mostrarModal(idModal) {
        const modal = document.getElementById(idModal);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    cerrarModales() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    buscarProductos(termino) {
        if (!termino.trim()) {
            this.mostrarProductos();
            return;
        }

        const filtrados = this.productos.filter(p => {
            const modelo = p.modelo || p.nombre || '';
            const marca = p.marca || p.categoria || '';
            const descripcion = p.descripcion || '';
            
            return modelo.toLowerCase().includes(termino.toLowerCase()) ||
                   marca.toLowerCase().includes(termino.toLowerCase()) ||
                   descripcion.toLowerCase().includes(termino.toLowerCase());
        });

        this.mostrarProductosFiltrados(filtrados);
    }

    mostrarProductosFiltrados(productos) {
        const contenedor = document.getElementById('grid-productos');
        if (!contenedor) return;
        
        if (!productos || productos.length === 0) {
            contenedor.innerHTML = '<p class="no-productos">No se encontraron productos</p>';
            return;
        }

        contenedor.innerHTML = productos.map(p => `
            <div class="producto-card">
                <div class="producto-imagen">
                    <div class="imagen-placeholder">👟</div>
                </div>
                <div class="producto-info">
                    <h3 class="producto-marca">${p.marca || p.categoria || 'Marca'}</h3>
                    <h4 class="producto-modelo">${p.modelo || p.nombre || 'Producto'}</h4>
                    <p class="producto-precio">€${p.precio || '0.00'}</p>
                    <button class="btn-agregar" data-id="${p.id_producto || p.id || '1'}" 
                            data-modelo="${p.modelo || p.nombre}" 
                            data-precio="${p.precio}">
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        `).join('');
    }

    async iniciarSesion() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.mostrarMensaje('Completa todos los campos', 'error');
            return;
        }

        try {
            console.log('🔑 Intentando login en:', `${this.apiUrl}/login`);
            
            const respuesta = await fetch(`${this.apiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const datos = await respuesta.json();
            console.log('Respuesta login:', datos);

            if (datos.success) {
                this.usuario = datos.usuario;
                localStorage.setItem('usuario_newshoes', JSON.stringify(this.usuario));
                this.actualizarHeader();
                this.cerrarModales();
                this.mostrarMensaje(`¡Bienvenido ${this.usuario.nombre}!`);
                document.getElementById('loginForm').reset();
            } else {
                this.mostrarMensaje(datos.message || 'Error en login', 'error');
            }
        } catch (error) {
            console.error('Error login:', error);
            this.mostrarMensaje('Error de conexión con el servidor', 'error');
        }
    }

    async registrarUsuario() {
        const nombre = document.getElementById('regNombre').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const direccion = document.getElementById('regDireccion').value.trim();

        if (!nombre || !email || !password) {
            this.mostrarMensaje('Completa los campos obligatorios', 'error');
            return;
        }

        if (password.length < 6) {
            this.mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        try {
            console.log('📝 Registrando usuario en:', `${this.apiUrl}/registro`);
            
            const respuesta = await fetch(`${this.apiUrl}/registro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombre, email, password, direccion })
            });

            const datos = await respuesta.json();
            console.log('Respuesta registro:', datos);

            if (datos.success) {
                this.mostrarMensaje('¡Cuenta creada! Ahora inicia sesión');
                document.getElementById('registerForm').reset();
                this.mostrarModal('modalLogin');
            } else {
                this.mostrarMensaje(datos.message || 'Error al registrar', 'error');
            }
        } catch (error) {
            console.error('Error registro:', error);
            this.mostrarMensaje('Error de conexión con el servidor', 'error');
        }
    }

    cerrarSesion() {
        this.usuario = null;
        localStorage.removeItem('usuario_newshoes');
        this.actualizarHeader();
        this.mostrarMensaje('Sesión cerrada');
    }

    actualizarHeader() {
        const userActions = document.querySelector('.user-actions');
        if (!userActions) return;
        
        if (this.usuario) {
            userActions.innerHTML = `
                <div class="user-logged">
                    <span class="user-info">👋 ${this.usuario.nombre}</span>
                    <button class="btn-logout" onclick="tienda.cerrarSesion()">Cerrar Sesión</button>
                </div>
            `;
        } else {
            userActions.innerHTML = `
                <button class="btn-carrito">🛒 Carrito</button>
                <button class="btn-login">👤 Login</button>
            `;
            
            setTimeout(() => {
                const btnLogin = document.querySelector('.btn-login');
                if (btnLogin) {
                    btnLogin.addEventListener('click', () => this.mostrarModal('modalLogin'));
                }
            }, 100);
        }
    }

    agregarAlCarrito(id, modelo, precio) {
        if (!this.usuario) {
            this.mostrarMensaje('Inicia sesión para agregar al carrito', 'error');
            this.mostrarModal('modalLogin');
            return;
        }

        const producto = {
            id: id,
            modelo: modelo,
            precio: parseFloat(precio),
            cantidad: 1,
            fecha: new Date().toISOString()
        };

        let carrito = JSON.parse(localStorage.getItem(`carrito_${this.usuario.id_usuario}`)) || [];
        carrito.push(producto);
        localStorage.setItem(`carrito_${this.usuario.id_usuario}`, JSON.stringify(carrito));

        this.mostrarMensaje(`✅ ${modelo} agregado al carrito`);
        console.log('Carrito actualizado:', carrito);
    }

    mostrarCarrito() {
        if (!this.usuario) {
            this.mostrarMensaje('Inicia sesión para ver el carrito', 'error');
            this.mostrarModal('modalLogin');
            return;
        }

        const carrito = JSON.parse(localStorage.getItem(`carrito_${this.usuario.id_usuario}`)) || [];
        
        if (carrito.length === 0) {
            this.mostrarMensaje('El carrito está vacío');
            return;
        }

        console.log('Carrito del usuario:', carrito);
        this.mostrarMensaje(`Carrito: ${carrito.length} productos`);
    }

    mostrarMensaje(texto, tipo = 'exito') {
        const mensajesAnteriores = document.querySelectorAll('.mensaje-flotante');
        mensajesAnteriores.forEach(msg => msg.remove());
        
        const mensaje = document.createElement('div');
        mensaje.className = `mensaje-flotante mensaje-${tipo}`;
        mensaje.textContent = texto;
        mensaje.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${tipo === 'error' ? '#f44336' : '#4CAF50'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(mensaje);

        setTimeout(() => {
            mensaje.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => mensaje.remove(), 300);
        }, 3000);
    }

    mostrarError(texto) {
        this.mostrarMensaje(texto, 'error');
    }
}

let tienda;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado');
    tienda = new Newshoes();
});


window.tienda = tienda;

if (!document.querySelector('#estilos-newshoes')) {
    const estilos = document.createElement('style');
    estilos.id = 'estilos-newshoes';
    estilos.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .producto-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .producto-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        .producto-imagen {
            text-align: center;
            margin-bottom: 15px;
        }
        .imagen-placeholder {
            font-size: 4rem;
            background: #f0f0f0;
            border-radius: 10px;
            padding: 20px;
        }
        .producto-marca {
            color: #e44d26;
            font-size: 0.9rem;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .producto-modelo {
            font-size: 1.2rem;
            margin-bottom: 10px;
            color: #333;
        }
        .producto-descripcion {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 10px;
        }
        .producto-precio {
            font-size: 1.4rem;
            font-weight: bold;
            color: #e44d26;
            margin-bottom: 5px;
        }
        .producto-stock {
            color: #28a745;
            font-size: 0.9rem;
            margin-bottom: 15px;
        }
        .btn-agregar {
            background: #333;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            transition: background 0.3s;
        }
        .btn-agregar:hover {
            background: #e44d26;
        }
        .no-productos {
            text-align: center;
            grid-column: 1 / -1;
            font-size: 1.2rem;
            color: #666;
            padding: 40px;
        }
        .user-logged {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .user-info {
            color: #333;
            font-weight: 500;
        }
        .btn-logout {
            background: #f44336;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        .btn-logout:hover {
            background: #d32f2f;
        }
    `;
    document.head.appendChild(estilos);
}