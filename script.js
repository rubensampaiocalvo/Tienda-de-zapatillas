// script.js - VERSIÓN COMPLETA CON ORDENAMIENTO Y CARRITO
class Newshoes {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.productos = [];  // Para búsquedas/filtrados
        this.todosProductos = []; // Todos los productos para mostrar
        this.productosFiltrados = []; // Productos filtrados actuales
        this.usuario = null;
        
        // Configuración de ordenamiento
        this.ordenActual = 'nombre'; // Por defecto: nombre A-Z
        this.categoriaActual = 'todas';
        
        console.log('🚀 Newshoes inicializado');
        this.verificarSesion();
        this.iniciar();
    }

    async iniciar() {
        try {
            // Cargar TODOS los productos
            await this.cargarTodosProductos();
            
            // Configurar eventos y mostrar productos
            this.configurarEventos();
            this.configurarOrdenamiento();
            this.mostrarProductosOrdenados();
            
            // Verificar conexión con el servidor
            await this.verificarConexion();
            
            console.log('✅ Aplicación iniciada correctamente');
        } catch (error) {
            console.error('❌ Error al iniciar:', error);
            this.mostrarError('Error al cargar la aplicación. Por favor, recarga la página.');
        }
    }

    async verificarConexion() {
        try {
            const respuesta = await fetch(`${this.apiUrl}/status`);
            if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
            
            const datos = await respuesta.json();
            
            if (datos.status === "ok") {
                console.log('✅ Servidor conectado correctamente');
            } else {
                console.error('❌ Error del servidor:', datos.message);
                this.mostrarMensaje('Advertencia: Error de conexión con el servidor', 'error');
            }
        } catch (error) {
            console.error('❌ No se pudo conectar al servidor:', error);
            this.mostrarMensaje('⚠️ Error de conexión. Verifica que el servidor esté corriendo en localhost:3000', 'warning');
        }
    }

    verificarSesion() {
        const usuarioGuardado = localStorage.getItem('usuario_newshoes');
        if (usuarioGuardado) {
            try {
                this.usuario = JSON.parse(usuarioGuardado);
                this.actualizarHeader();
                console.log('👤 Usuario en sesión:', this.usuario.nombre);
            } catch (error) {
                console.error('❌ Error al parsear usuario:', error);
                localStorage.removeItem('usuario_newshoes');
            }
        }
    }

    async cargarTodosProductos() {
        try {
            console.log('📦 Cargando TODOS los productos...');
            
            // Intentar con /api/productos primero
            let respuesta = await fetch(`${this.apiUrl}/productos`);
            
            // Si falla, intentar con /api/zapatillas como alternativa
            if (!respuesta.ok) {
                console.log('⚠️ /api/productos no disponible, intentando /api/zapatillas...');
                respuesta = await fetch(`${this.apiUrl}/zapatillas`);
            }
            
            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            }
            
            const datos = await respuesta.json();
            
            if (datos.error) {
                throw new Error(datos.error);
            }
            
            // Guardar en ambos arrays
            this.todosProductos = datos;
            this.productos = [...datos]; // Copia para búsquedas
            this.productosFiltrados = [...datos]; // Inicialmente todos los productos
            
            console.log(`✅ ${this.todosProductos.length} productos cargados`);
            
            // Si no hay productos, mostrar mensaje
            if (this.todosProductos.length === 0) {
                console.warn('⚠️ No hay productos en la base de datos');
                this.mostrarMensaje('No hay productos disponibles', 'info');
            }
            
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
            this.mostrarError(`No se pudieron cargar los productos: ${error.message}`);
            this.todosProductos = [];
            this.productos = [];
            this.productosFiltrados = [];
        }
    }

    // ========== MÉTODOS DE ORDENAMIENTO ==========

    configurarOrdenamiento() {
        const selectOrdenar = document.getElementById('ordenar-por');
        
        if (!selectOrdenar) {
            console.log('⚠️ No se encontró el selector de ordenamiento, creando uno dinámico...');
            this.crearSelectorOrdenamiento();
            return;
        }
        
        selectOrdenar.addEventListener('change', (e) => {
            this.ordenActual = e.target.value;
            console.log(`🔄 Cambiando orden a: ${this.ordenActual}`);
            this.mostrarProductosOrdenados();
        });
        
        console.log('🎛️ Selector de ordenamiento configurado');
    }

    crearSelectorOrdenamiento() {
        // Crear contenedor para ordenamiento si no existe
        const filtrosContainer = document.querySelector('.filtros');
        if (!filtrosContainer) return;
        
        const ordenamientoHTML = `
            <div class="ordenamiento" style="margin-top: 20px;">
                <label for="ordenar-por" style="margin-right: 10px;">Ordenar por:</label>
                <select id="ordenar-por" class="select-ordenar" style="padding: 8px; border-radius: 5px;">
                    <option value="nombre">Nombre (A-Z)</option>
                    <option value="nombre-desc">Nombre (Z-A)</option>
                    <option value="precio-asc">Precio (Menor a Mayor)</option>
                    <option value="precio-desc">Precio (Mayor a Menor)</option>
                    <option value="stock">Stock (Mayor a Menor)</option>
                </select>
            </div>
        `;
        
        filtrosContainer.insertAdjacentHTML('afterend', ordenamientoHTML);
        
        // Configurar evento
        setTimeout(() => {
            this.configurarOrdenamiento();
        }, 100);
    }

    ordenarProductos(productos) {
        if (!productos || productos.length === 0) return productos;
        
        console.log(`📊 Ordenando ${productos.length} productos por: ${this.ordenActual}`);
        
        switch(this.ordenActual) {
            case 'nombre':
                // Ordenar por nombre A-Z
                return [...productos].sort((a, b) => {
                    const nombreA = (a.modelo || a.nombre || '').toLowerCase();
                    const nombreB = (b.modelo || b.nombre || '').toLowerCase();
                    return nombreA.localeCompare(nombreB);
                });
                
            case 'nombre-desc':
                // Ordenar por nombre Z-A
                return [...productos].sort((a, b) => {
                    const nombreA = (a.modelo || a.nombre || '').toLowerCase();
                    const nombreB = (b.modelo || b.nombre || '').toLowerCase();
                    return nombreB.localeCompare(nombreA);
                });
                
            case 'precio-asc':
                // Ordenar por precio de menor a mayor
                return [...productos].sort((a, b) => {
                    const precioA = parseFloat(a.precio || 0);
                    const precioB = parseFloat(b.precio || 0);
                    return precioA - precioB;
                });
                
            case 'precio-desc':
                // Ordenar por precio de mayor a menor
                return [...productos].sort((a, b) => {
                    const precioA = parseFloat(a.precio || 0);
                    const precioB = parseFloat(b.precio || 0);
                    return precioB - precioA;
                });
                
            case 'stock':
                // Ordenar por stock de mayor a menor
                return [...productos].sort((a, b) => {
                    const stockA = parseInt(a.stock || 0);
                    const stockB = parseInt(b.stock || 0);
                    return stockB - stockA;
                });
                
            case 'destacados':
                // Mostrar productos destacados primero (si tienen propiedad destacado)
                return [...productos].sort((a, b) => {
                    const destacadoA = a.destacado ? 1 : 0;
                    const destacadoB = b.destacado ? 1 : 0;
                    return destacadoB - destacadoA;
                });
                
            default:
                return productos;
        }
    }

    filtrarPorCategoria(categoria) {
        this.categoriaActual = categoria.toLowerCase();
        
        if (categoria === 'todas') {
            this.productosFiltrados = [...this.todosProductos];
        } else {
            this.productosFiltrados = this.todosProductos.filter(producto => {
                // Verificar por marca o categoría
                const marca = (producto.marca || '').toLowerCase();
                const cat = (producto.categoria || '').toLowerCase();
                
                return marca.includes(categoria) || 
                       cat.includes(categoria) ||
                       (producto.modelo || '').toLowerCase().includes(categoria);
            });
        }
        
        console.log(`🏷️ Filtrando por categoría: ${categoria} - ${this.productosFiltrados.length} productos`);
        this.mostrarProductosOrdenados();
    }

    mostrarProductosOrdenados() {
        // Ordenar los productos filtrados
        const productosOrdenados = this.ordenarProductos(this.productosFiltrados);
        
        // Mostrar los productos ordenados
        this.mostrarProductos(productosOrdenados);
        
        // Actualizar contador
        this.actualizarContadorProductos();
    }

    mostrarProductos(productosAMostrar = null) {
        console.log('🎯 Mostrando productos...');
        
        const contenedor = document.getElementById('grid-productos');
        
        if (!contenedor) {
            console.error('❌ No se encontró #grid-productos');
            return;
        }

        // Usar productos específicos o los filtrados
        const productos = productosAMostrar || this.productosFiltrados;
        
        if (!productos || productos.length === 0) {
            contenedor.innerHTML = `
                <div class="no-productos" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <h3>😔 No se encontraron productos</h3>
                    <p>Intenta cambiar los filtros o la búsqueda.</p>
                </div>
            `;
            return;
        }

        console.log(`📊 Mostrando ${productos.length} productos ordenados`);
        
        // Asegurar que el contenedor tenga grid
        contenedor.style.display = 'grid';
        contenedor.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        contenedor.style.gap = '20px';
        
        // Crear HTML de productos
        const productosHTML = productos.map(producto => `
            <div class="producto-card">
                <div class="producto-imagen">
                    <div class="imagen-placeholder">
                        ${(producto.marca || '').toLowerCase().includes('nike') ? '✔️' : 
                          (producto.marca || '').toLowerCase().includes('adidas') ? '🔷' : 
                          (producto.marca || '').toLowerCase().includes('jordan') ? '🏀' : '👟'}
                    </div>
                </div>
                <div class="producto-info">
                    <h3 class="producto-marca">${producto.marca || producto.categoria || 'Marca'}</h3>
                    <h4 class="producto-modelo">${producto.modelo || producto.nombre || 'Producto'}</h4>
                    <p class="producto-descripcion">${producto.descripcion || 'Producto de alta calidad'}</p>
                    
                    <div class="producto-detalles">
                        <div class="producto-precio">€${parseFloat(producto.precio || 0).toFixed(2)}</div>
                        <div class="producto-stock" style="color: ${(producto.stock || 0) > 0 ? '#28a745' : '#dc3545'};">
                            ${(producto.stock || 0) > 0 ? `Stock: ${producto.stock}` : 'Agotado'}
                        </div>
                    </div>
                    
                    <button class="btn-agregar" 
                            data-id="${producto.id_producto || producto.id || '1'}" 
                            data-modelo="${producto.modelo || producto.nombre || 'Producto'}" 
                            data-precio="${producto.precio || 0}"
                            ${(producto.stock || 0) === 0 ? 'disabled style="background: #ccc;"' : ''}>
                        ${(producto.stock || 0) === 0 ? 'Agotado' : 'Agregar al Carrito'}
                    </button>
                </div>
            </div>
        `).join('');
        
        contenedor.innerHTML = productosHTML;
        console.log('✅ Grid de productos creado y ordenado');
    }

    actualizarContadorProductos() {
        const contador = document.getElementById('contador-productos');
        const totalSpan = document.getElementById('total-productos');
        
        if (contador && totalSpan) {
            totalSpan.textContent = this.productosFiltrados.length;
            
            // Mostrar información del ordenamiento actual
            const ordenText = this.obtenerTextoOrdenamiento();
            contador.innerHTML = `Mostrando <span id="total-productos">${this.productosFiltrados.length}</span> productos <span style="color: #666; font-size: 0.9rem;">(${ordenText})</span>`;
        }
    }

    obtenerTextoOrdenamiento() {
        const textos = {
            'nombre': 'ordenados por nombre A-Z',
            'nombre-desc': 'ordenados por nombre Z-A',
            'precio-asc': 'ordenados por precio menor a mayor',
            'precio-desc': 'ordenados por precio mayor a menor',
            'stock': 'ordenados por stock mayor a menor',
            'destacados': 'destacados primero'
        };
        
        return textos[this.ordenActual] || 'ordenados';
    }

    buscarProductos(termino) {
        const buscador = document.getElementById('buscador');
        const seccionProductos = document.querySelector('#productos');
        
        if (!termino.trim()) {
            // Si la búsqueda está vacía, mostrar todos
            this.productosFiltrados = [...this.todosProductos];
            this.mostrarProductosOrdenados();
            
            // Quitar clase de búsqueda
            if (seccionProductos) {
                seccionProductos.classList.remove('buscando');
            }
            return;
        }

        const terminoLower = termino.toLowerCase();
        
        // Filtrar productos
        this.productosFiltrados = this.todosProductos.filter(p => {
            const modelo = (p.modelo || p.nombre || '').toLowerCase();
            const marca = (p.marca || p.categoria || '').toLowerCase();
            const descripcion = (p.descripcion || '').toLowerCase();
            
            return modelo.includes(terminoLower) ||
                   marca.includes(terminoLower) ||
                   descripcion.includes(terminoLower);
        });

        console.log(`🔍 Resultados búsqueda: ${this.productosFiltrados.length} productos`);
        
        // Añadir clase para estilos especiales
        if (seccionProductos) {
            seccionProductos.classList.add('buscando');
        }
        
        // Mostrar resultados
        this.mostrarProductosOrdenados();
        
        // Desplazar a los resultados si hay alguno
        if (this.productosFiltrados.length > 0 && seccionProductos) {
            setTimeout(() => {
                seccionProductos.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 300);
        }
        
        // Mantener foco en el buscador
        if (buscador) {
            buscador.focus();
        }
    }

    // ========== CONFIGURACIÓN DE EVENTOS ==========

    configurarEventos() {
        console.log('🔧 Configurando eventos...');
        
        // Login
        const btnLogin = document.querySelector('.btn-login');
        if (btnLogin) {
            btnLogin.addEventListener('click', () => {
                console.log('👤 Click en login');
                this.mostrarModal('modalLogin');
            });
        }

        // Carrito
        const btnCarrito = document.querySelector('.btn-carrito');
        if (btnCarrito) {
            btnCarrito.addEventListener('click', () => {
                console.log('🛒 Click en carrito');
                this.mostrarCarrito();
            });
        }

        // Botón "Ver TODOS los Productos"
        const btnColeccion = document.querySelector('.btn-primary');
        if (btnColeccion) {
            btnColeccion.addEventListener('click', () => {
                const productosSection = document.querySelector('#productos');
                if (productosSection) {
                    productosSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Buscador
        const buscador = document.getElementById('buscador');
        if (buscador) {
            buscador.addEventListener('input', (e) => {
                this.buscarProductos(e.target.value);
            });
        }

        // Filtros
        document.querySelectorAll('.filtro-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Quitar clase active a todos
                document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
                // Agregar al botón clickeado
                e.target.classList.add('active');
                
                const categoria = e.target.textContent.toLowerCase();
                this.filtrarPorCategoria(categoria);
            });
        });

        // Cerrar modales
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.cerrarModales();
            });
        });

        // Link para mostrar registro
        const linkRegistro = document.getElementById('showRegister');
        if (linkRegistro) {
            linkRegistro.addEventListener('click', (e) => {
                e.preventDefault();
                this.mostrarModal('modalRegister');
            });
        }

        // Formulario de login
        const formLogin = document.getElementById('loginForm');
        if (formLogin) {
            formLogin.addEventListener('submit', (e) => {
                e.preventDefault();
                this.iniciarSesion();
            });
        }

        // Formulario de registro
        const formRegistro = document.getElementById('registerForm');
        if (formRegistro) {
            formRegistro.addEventListener('submit', (e) => {
                e.preventDefault();
                this.registrarUsuario();
            });
        }

        // Cerrar modales al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.cerrarModales();
            }
        });

        // Agregar al carrito
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-agregar')) {
                const id = e.target.getAttribute('data-id');
                const modelo = e.target.getAttribute('data-modelo');
                const precio = e.target.getAttribute('data-precio');
                
                if (!e.target.disabled) {
                    this.agregarAlCarrito(id, modelo, precio);
                }
            }
        });

        console.log('✅ Eventos configurados');
    }

    // ========== MÉTODOS DE AUTENTICACIÓN ==========

    async iniciarSesion() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.mostrarMensaje('Completa todos los campos', 'error');
            return;
        }

        try {
            console.log('🔑 Intentando login...');
            
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
            console.log('📝 Registrando usuario...');
            
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
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            this.usuario = null;
            localStorage.removeItem('usuario_newshoes');
            this.actualizarHeader();
            this.mostrarMensaje('Sesión cerrada');
        }
    }

    // ========== MÉTODOS DEL CARRITO ==========

    obtenerCarritoUsuario() {
        if (!this.usuario) return [];
        const carrito = JSON.parse(localStorage.getItem(`carrito_${this.usuario.id_usuario}`)) || [];
        return carrito;
    }

    guardarCarritoUsuario(carrito) {
        if (!this.usuario) return;
        localStorage.setItem(`carrito_${this.usuario.id_usuario}`, JSON.stringify(carrito));
    }

    obtenerCantidadCarrito() {
        if (!this.usuario) return 0;
        const carrito = this.obtenerCarritoUsuario();
        return carrito.reduce((total, item) => total + item.cantidad, 0);
    }

    agregarAlCarrito(id, modelo, precio) {
        if (!this.usuario) {
            this.mostrarMensaje('Inicia sesión para agregar al carrito', 'error');
            this.mostrarModal('modalLogin');
            return;
        }

        let carrito = this.obtenerCarritoUsuario();
        
        // Buscar si el producto ya está en el carrito
        const productoExistente = carrito.find(item => item.id === id);
        
        if (productoExistente) {
            // Si ya existe, aumentar cantidad
            productoExistente.cantidad += 1;
            this.mostrarMensaje(`✅ ${modelo} (x${productoExistente.cantidad}) actualizado en el carrito`);
        } else {
            // Si no existe, agregar nuevo producto
            const producto = {
                id: id,
                modelo: modelo,
                precio: parseFloat(precio),
                cantidad: 1,
                fecha: new Date().toISOString()
            };
            
            carrito.push(producto);
            this.mostrarMensaje(`✅ ${modelo} agregado al carrito`);
        }
        
        this.guardarCarritoUsuario(carrito);
        this.actualizarHeader();
    }

    mostrarCarrito() {
        if (!this.usuario) {
            this.mostrarMensaje('Inicia sesión para ver el carrito', 'error');
            this.mostrarModal('modalLogin');
            return;
        }

        this.actualizarCarritoModal();
        this.mostrarModal('modalCarrito');
    }

    actualizarCarritoModal() {
        const carrito = this.obtenerCarritoUsuario();
        
        const carritoVacio = document.getElementById('carrito-vacio');
        const carritoContenido = document.getElementById('carrito-contenido');
        const carritoItems = document.getElementById('carrito-items');
        
        if (!carritoVacio || !carritoContenido || !carritoItems) return;
        
        if (carrito.length === 0) {
            carritoVacio.style.display = 'block';
            carritoContenido.style.display = 'none';
            return;
        }
        
        carritoVacio.style.display = 'none';
        carritoContenido.style.display = 'block';
        
        // Calcular totales
        let subtotal = 0;
        
        // Generar HTML de los productos del carrito
        const itemsHTML = carrito.map((item, index) => {
            const itemTotal = item.precio * item.cantidad;
            subtotal += itemTotal;
            
            return `
                <div class="carrito-item" data-index="${index}">
                    <div class="carrito-item-imagen">
                        ${this.getProductoIcon(item.modelo)}
                    </div>
                    <div class="carrito-item-info">
                        <div class="carrito-item-nombre">${item.modelo}</div>
                        <div class="carrito-item-precio">€${item.precio.toFixed(2)} c/u</div>
                    </div>
                    <div class="carrito-item-controles">
                        <div class="carrito-cantidad">
                            <button class="btn-cantidad btn-menos" data-index="${index}">-</button>
                            <span class="carrito-cantidad-num">${item.cantidad}</span>
                            <button class="btn-cantidad btn-mas" data-index="${index}">+</button>
                        </div>
                        <div class="carrito-item-total">€${itemTotal.toFixed(2)}</div>
                        <button class="btn-eliminar" data-index="${index}">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
        
        carritoItems.innerHTML = itemsHTML;
        
        // Calcular totales
        const envio = subtotal > 50 ? 0 : 5.99; // Envío gratis si compra > €50
        const total = subtotal + envio;
        
        // Actualizar resumen
        document.getElementById('carrito-subtotal').textContent = `€${subtotal.toFixed(2)}`;
        document.getElementById('carrito-envio').textContent = envio === 0 ? 'GRATIS' : `€${envio.toFixed(2)}`;
        document.getElementById('carrito-total').textContent = `€${total.toFixed(2)}`;
        
        // Configurar eventos para los controles del carrito
        this.configurarEventosCarrito();
    }

    getProductoIcon(modelo) {
        const modeloLower = modelo.toLowerCase();
        if (modeloLower.includes('nike')) return '✔️';
        if (modeloLower.includes('adidas')) return '🔷';
        if (modeloLower.includes('jordan')) return '🏀';
        if (modeloLower.includes('running')) return '🏃‍♂️';
        if (modeloLower.includes('basket')) return '🏀';
        return '👟';
    }

    configurarEventosCarrito() {
        // Botones de aumentar cantidad
        document.querySelectorAll('.btn-mas').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.cambiarCantidadCarrito(index, 1);
            });
        });
        
        // Botones de disminuir cantidad
        document.querySelectorAll('.btn-menos').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.cambiarCantidadCarrito(index, -1);
            });
        });
        
        // Botones de eliminar
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.eliminarDelCarrito(index);
            });
        });
        
        // Botón de finalizar compra
        const btnFinalizar = document.getElementById('btn-finalizar-compra');
        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', () => {
                this.finalizarCompra();
            });
        }
    }

    cambiarCantidadCarrito(index, cambio) {
        let carrito = this.obtenerCarritoUsuario();
        
        if (carrito[index]) {
            carrito[index].cantidad += cambio;
            
            // Si la cantidad es 0 o menos, eliminar producto
            if (carrito[index].cantidad <= 0) {
                carrito.splice(index, 1);
                this.mostrarMensaje('Producto eliminado del carrito');
            } else {
                this.mostrarMensaje(`Cantidad actualizada: ${carrito[index].modelo} (${carrito[index].cantidad})`);
            }
            
            this.guardarCarritoUsuario(carrito);
            this.actualizarCarritoModal();
            this.actualizarHeader();
        }
    }

    eliminarDelCarrito(index) {
        if (confirm('¿Estás seguro de eliminar este producto del carrito?')) {
            let carrito = this.obtenerCarritoUsuario();
            
            if (carrito[index]) {
                const productoNombre = carrito[index].modelo;
                carrito.splice(index, 1);
                
                this.guardarCarritoUsuario(carrito);
                this.actualizarCarritoModal();
                this.actualizarHeader();
                this.mostrarMensaje(`✅ ${productoNombre} eliminado del carrito`);
            }
        }
    }

    finalizarCompra() {
        const carrito = this.obtenerCarritoUsuario();
        
        if (carrito.length === 0) {
            this.mostrarMensaje('El carrito está vacío', 'error');
            return;
        }
        
        // Calcular total
        const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const envio = subtotal > 50 ? 0 : 5.99;
        const total = subtotal + envio;
        
        if (confirm(`¿Finalizar compra por €${total.toFixed(2)}?`)) {
            console.log('Compra finalizada:', carrito);
            
            // Vaciar el carrito después de la compra
            localStorage.removeItem(`carrito_${this.usuario.id_usuario}`);
            
            this.cerrarModales();
            this.mostrarMensaje('✅ ¡Compra realizada con éxito! Gracias por tu compra.');
            this.actualizarHeader();
        }
    }

    // ========== MÉTODOS DE INTERFAZ ==========

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

    actualizarHeader() {
        const userActions = document.querySelector('.user-actions');
        if (!userActions) return;
        
        if (this.usuario) {
            const cantidad = this.obtenerCantidadCarrito();
            
            userActions.innerHTML = `
                <button class="btn-carrito">🛒 Carrito ${cantidad > 0 ? `(${cantidad})` : ''}</button>
                <div class="user-logged">
                    <span class="user-info">👋 ${this.usuario.nombre}</span>
                    <button class="btn-logout">Cerrar Sesión</button>
                </div>
            `;
            
            // Reconfigurar eventos
            setTimeout(() => {
                const btnCarrito = userActions.querySelector('.btn-carrito');
                if (btnCarrito) {
                    btnCarrito.addEventListener('click', () => {
                        this.mostrarCarrito();
                    });
                }
                
                const btnLogout = userActions.querySelector('.btn-logout');
                if (btnLogout) {
                    btnLogout.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.cerrarSesion();
                    });
                }
            }, 50);
            
        } else {
            userActions.innerHTML = `
                <button class="btn-carrito">🛒 Carrito</button>
                <button class="btn-login">👤 Login</button>
            `;
            
            setTimeout(() => {
                const btnLogin = userActions.querySelector('.btn-login');
                if (btnLogin) {
                    btnLogin.addEventListener('click', () => this.mostrarModal('modalLogin'));
                }
            }, 50);
        }
    }

    mostrarMensaje(texto, tipo = 'exito') {
        const mensajesAnteriores = document.querySelectorAll('.mensaje-flotante');
        mensajesAnteriores.forEach(msg => msg.remove());
        
        const colores = {
            exito: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        
        const mensaje = document.createElement('div');
        mensaje.className = `mensaje-flotante mensaje-${tipo}`;
        mensaje.textContent = texto;
        mensaje.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colores[tipo] || colores.info};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 400px;
            word-wrap: break-word;
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

// ========== FUNCIONES GLOBALES ==========

function mostrarTodosProductos() {
    if (tienda && tienda.mostrarProductosOrdenados) {
        tienda.mostrarProductosOrdenados();
        
        // Cambiar el título
        const titulo = document.querySelector('#productos h2');
        if (titulo) {
            titulo.textContent = 'TODOS Nuestros Productos';
        }
        
        // Desplazar a la sección
        const seccion = document.querySelector('#productos');
        if (seccion) {
            seccion.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Variable global de la tienda
let tienda;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado - Iniciando Newshoes...');
    tienda = new Newshoes();
    window.tienda = tienda;
});

// Agregar estilos dinámicos
if (!document.querySelector('#estilos-ordenamiento')) {
    const estilos = document.createElement('style');
    estilos.id = 'estilos-ordenamiento';
    estilos.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .ordenamiento {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 20px 0;
        }
        
        .ordenamiento label {
            font-weight: 600;
            color: #333;
        }
        
        .select-ordenar {
            padding: 8px 15px;
            border: 2px solid #ddd;
            border-radius: 5px;
            background: white;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .select-ordenar:focus {
            border-color: #e44d26;
            outline: none;
            box-shadow: 0 0 0 2px rgba(228, 77, 38, 0.2);
        }
    `;
    document.head.appendChild(estilos);
}