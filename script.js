class SneakerHub {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
        this.productos = [];
        this.carrito = [];
        this.usuarioLogueado = null;
        this.verificarLoginGuardado();
        this.init();
    }

    async init() {
        await this.cargarProductos();
        this.mostrarProductos();
        this.setupEventListeners();
    }

    verificarLoginGuardado() {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            this.usuarioLogueado = JSON.parse(usuarioGuardado);
            this.actualizarHeader();
        }
    }

    async cargarProductos() {
        try {
            console.log('Cargando productos...');
            const response = await fetch(`${this.apiUrl}/zapatillas`);
            
            if (!response.ok) {
                throw new Error('Error al cargar productos');
            }
            
            this.productos = await response.json();
            console.log('Productos cargados:', this.productos);
            
        } catch (error) {
            console.error('Error:', error);
            this.mostrarError('No se pudieron cargar los productos');
        }
    }

    mostrarProductos() {
        const grid = document.getElementById('grid-productos');
        
        if (this.productos.length === 0) {
            grid.innerHTML = '<p class="no-productos">No hay productos disponibles</p>';
            return;
        }

        grid.innerHTML = this.productos.map(producto => `
            <div class="producto-card">
                <div class="producto-imagen">
                    <div class="imagen-placeholder">👟</div>
                </div>
                <div class="producto-info">
                    <h3 class="producto-marca">${producto.marca}</h3>
                    <h4 class="producto-modelo">${producto.modelo}</h4>
                    <p class="producto-descripcion">${producto.descripcion || 'Zapatilla de alta calidad'}</p>
                    <div class="producto-precio">€${producto.precio}</div>
                    <div class="producto-stock">Stock: ${producto.stock}</div>
                    <button class="btn-agregar" onclick="tienda.agregarAlCarrito('${producto.modelo}', ${producto.precio})">
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Filtros
        const filtroBtns = document.querySelectorAll('.filtro-btn');
        filtroBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filtroBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filtrarProductos(e.target.textContent);
            });
        });

        // Botón ver colección
        document.querySelector('.btn-primary').addEventListener('click', () => {
            document.querySelector('#productos').scrollIntoView({
                behavior: 'smooth'
            });
        });
        
        // Buscador
        const buscador = document.getElementById('buscador');
        buscador.addEventListener('input', (e) => {
            this.buscarProductos(e.target.value);
        });
        
        // LOGIN
        document.querySelector('.btn-login').addEventListener('click', () => {
            this.mostrarModalLogin();
        });

        // Cerrar modales
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.cerrarModales();
            });
        });

        // Mostrar registro
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.mostrarModalRegistro();
        });

        // Formularios
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.iniciarSesion();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarUsuario();
        });

        // Cerrar modal al hacer click fuera
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.cerrarModales();
            }
        });
    }

    buscarProductos(termino) {
        if (termino.trim() === '') {
            this.mostrarProductos();
            return;
        }

        const productosFiltrados = this.productos.filter(producto => 
            producto.modelo.toLowerCase().includes(termino.toLowerCase()) ||
            producto.marca.toLowerCase().includes(termino.toLowerCase()) ||
            producto.categoria.toLowerCase().includes(termino.toLowerCase())
        );
        
        this.mostrarProductosFiltrados(productosFiltrados);
    }

    filtrarProductos(categoria) {
        if (categoria === 'Todas') {
            this.mostrarProductos();
            return;
        }

        const productosFiltrados = this.productos.filter(producto => 
            producto.categoria === categoria
        );
        
        this.mostrarProductosFiltrados(productosFiltrados);
    }

    mostrarProductosFiltrados(productos) {
        const grid = document.getElementById('grid-productos');
        
        if (productos.length === 0) {
            grid.innerHTML = '<p class="no-productos">No hay productos en esta categoría</p>';
            return;
        }

        grid.innerHTML = productos.map(producto => `
            <div class="producto-card">
                <div class="producto-imagen">
                    <div class="imagen-placeholder">👟</div>
                </div>
                <div class="producto-info">
                    <h3 class="producto-marca">${producto.marca}</h3>
                    <h4 class="producto-modelo">${producto.modelo}</h4>
                    <p class="producto-precio">€${producto.precio}</p>
                    <button class="btn-agregar" onclick="tienda.agregarAlCarrito('${producto.modelo}', ${producto.precio})">
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        `).join('');
    }

    agregarAlCarrito(modelo, precio) {
        // Verificar si el usuario está logueado
        if (!this.usuarioLogueado) {
            this.mostrarMensaje('Debes iniciar sesión para agregar productos al carrito', 'error');
            this.mostrarModalLogin();
            return;
        }

        this.carrito.push({ modelo, precio });
        this.mostrarMensaje(`✅ ${modelo} agregado al carrito`);
        console.log('Carrito:', this.carrito);
    }

    // FUNCIONES DE LOGIN
    mostrarModalLogin() {
        document.getElementById('modalLogin').style.display = 'block';
    }

    mostrarModalRegistro() {
        document.getElementById('modalLogin').style.display = 'none';
        document.getElementById('modalRegister').style.display = 'block';
    }

    cerrarModales() {
        document.getElementById('modalLogin').style.display = 'none';
        document.getElementById('modalRegister').style.display = 'none';
    }

    async iniciarSesion() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.mostrarMensaje('Por favor completa todos los campos', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.usuarioLogueado = data.usuario;
                this.actualizarHeader();
                this.cerrarModales();
                this.mostrarMensaje(`¡Bienvenido, ${this.usuarioLogueado.nombre}!`);
                document.getElementById('loginForm').reset();
                
                // Guardar en localStorage
                localStorage.setItem('usuario', JSON.stringify(this.usuarioLogueado));
            } else {
                this.mostrarMensaje(data.message, 'error');
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.mostrarMensaje('Error al conectar con el servidor', 'error');
        }
    }

    async registrarUsuario() {
        const nombre = document.getElementById('regNombre').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const direccion = document.getElementById('regDireccion').value;

        if (!nombre || !email || !password) {
            this.mostrarMensaje('Por favor completa todos los campos obligatorios', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/registro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombre, email, password, direccion })
            });

            const data = await response.json();

            if (data.success) {
                this.mostrarMensaje('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
                this.mostrarModalLogin();
                document.getElementById('registerForm').reset();
            } else {
                this.mostrarMensaje(data.message, 'error');
            }
        } catch (error) {
            console.error('Error en registro:', error);
            this.mostrarMensaje('Error al conectar con el servidor', 'error');
        }
    }

    actualizarHeader() {
        const userActions = document.querySelector('.user-actions');
        
        if (this.usuarioLogueado) {
            userActions.innerHTML = `
                <div class="user-logged">
                    <span class="user-info">👋 Hola, ${this.usuarioLogueado.nombre}</span>
                    <button class="btn-logout" onclick="tienda.cerrarSesion()">Cerrar Sesión</button>
                </div>
            `;
        } else {
            userActions.innerHTML = `
                <button class="btn-carrito">🛒 Carrito</button>
                <button class="btn-login">👤 Login</button>
            `;
            
            // Re-asignar event listeners
            document.querySelector('.btn-login').addEventListener('click', () => {
                this.mostrarModalLogin();
            });
        }
    }

    cerrarSesion() {
        this.usuarioLogueado = null;
        localStorage.removeItem('usuario');
        this.actualizarHeader();
        this.mostrarMensaje('Sesión cerrada correctamente');
    }

    mostrarMensaje(mensaje, tipo = 'success') {
        const notification = document.createElement('div');
        const backgroundColor = tipo === 'error' ? '#f44336' : '#4CAF50';
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = mensaje;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    mostrarError(mensaje) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            background: #f44336;
            color: white;
            padding: 15px;
            text-align: center;
            margin: 20px;
            border-radius: 5px;
        `;
        errorDiv.textContent = mensaje;
        document.querySelector('.productos').prepend(errorDiv);
    }
}

// Inicializar la tienda
const tienda = new SneakerHub();