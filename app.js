// Mostrar tabla de movimientos con opción de eliminar

function mostrarTablaMovimientos() {
    const movs = obtenerMovimientos();
    const div = document.getElementById('tabla-movimientos');
    if (!div) return;
    if (movs.length === 0) {
        div.innerHTML = '<em>No hay movimientos registrados.</em>';
        return;
    }
    let html = '<table class="tabla-movs"><thead><tr><th>Tipo</th><th>Descripción</th><th>Monto</th><th>Fecha</th><th></th></tr></thead><tbody>';
    movs.forEach((m, i) => {
        html += `<tr><td>${m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}</td><td>${m.descripcion}</td><td>${formatoRD(m.monto)}</td><td>${m.fecha}</td><td><button class='btn-eliminar' data-idx='${i}'>Eliminar</button></td></tr>`;
    });
    html += '</tbody></table>';
    div.innerHTML = html;
    // Asignar eventos a los botones eliminar
    const btns = div.querySelectorAll('.btn-eliminar');
    btns.forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.getAttribute('data-idx'));
            eliminarMovimiento(idx);
        });
    });
}

function eliminarMovimiento(idx) {
    let movs = obtenerMovimientos();
    movs.splice(idx, 1);
    guardarMovimientos(movs);
    actualizarTodo();
    mostrarTablaMovimientos();
}
// --- Control de movimientos (ingresos/gastos) ---
const movimientosKey = 'cafeteria_movimientos';
const inventarioKey = 'cafeteria_inventario';

function obtenerMovimientos() {
    return JSON.parse(localStorage.getItem(movimientosKey)) || [];
}
function guardarMovimientos(movs) {
    localStorage.setItem(movimientosKey, JSON.stringify(movs));
}

function agregarMovimiento(mov) {
    const movs = obtenerMovimientos();
    movs.push(mov);
    guardarMovimientos(movs);
}

// --- Control de inventario ---
function obtenerInventario() {
    return JSON.parse(localStorage.getItem(inventarioKey)) || [];
}
function guardarInventario(inv) {
    localStorage.setItem(inventarioKey, JSON.stringify(inv));
}

function agregarActualizarProducto(producto, cantidad) {
    let inventario = obtenerInventario();
    const idx = inventario.findIndex(p => p.producto === producto);
    if (idx >= 0) {
        inventario[idx].cantidad = cantidad;
    } else {
        inventario.push({ producto, cantidad });
    }
    guardarInventario(inventario);
}

// --- Manejo de formularios ---
document.getElementById('form-movimiento').onsubmit = function(e) {
    e.preventDefault();
    const tipo = document.getElementById('tipo').value;
    const descripcion = document.getElementById('descripcion').value;
    const monto = parseFloat(document.getElementById('monto').value);
    const fecha = document.getElementById('fecha').value;
    agregarMovimiento({ tipo, descripcion, monto, fecha });
    alert('Movimiento registrado');
    this.reset();
};


const formInv = document.getElementById('form-inventario');
if (formInv) {
    formInv.onsubmit = function(e) {
        e.preventDefault();
        const producto = document.getElementById('producto').value;
        const cantidad = parseInt(document.getElementById('cantidad').value);
        agregarActualizarProducto(producto, cantidad);
        mostrarInventario();
        this.reset();
    };
}


function mostrarInventario() {
    const div = document.getElementById('lista-inventario');
    if (!div) return;
    const inventario = obtenerInventario();
    if (inventario.length === 0) {
        div.innerHTML = '<em>No hay productos registrados.</em>';
        return;
    }
    div.innerHTML = '<ul>' + inventario.map(p => `<li>${p.producto}: ${p.cantidad}</li>`).join('') + '</ul>';
}

// --- Reportes ---

// Formato moneda RD$
function formatoRD(monto) {
    return monto.toLocaleString('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 });
}

function mostrarReporte(tipo) {
    const movs = obtenerMovimientos();
    const ahora = new Date();
    let inicio, fin;
    if (tipo === 'semana') {
        const dia = ahora.getDay() || 7;
        inicio = new Date(ahora);
        inicio.setDate(ahora.getDate() - dia + 1);
        fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 6);
    } else {
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
    }
    const filtrados = movs.filter(m => {
        const f = new Date(m.fecha);
        return f >= inicio && f <= fin;
    });
    const ingresos = filtrados.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.monto, 0);
    const gastos = filtrados.filter(m => m.tipo === 'gasto').reduce((a, b) => a + b.monto, 0);
    const div = document.getElementById('reporte-resultado');
    div.innerHTML = `<strong>Del ${inicio.toLocaleDateString()} al ${fin.toLocaleDateString()}:</strong><br>
    Ingresos: ${formatoRD(ingresos)}<br>
    Gastos: ${formatoRD(gastos)}<br>
    <strong>Total: ${formatoRD(ingresos - gastos)}</strong>`;
}


// --- Dashboard ---

function actualizarDashboard() {
    const movs = obtenerMovimientos();
    const ahora = new Date();
    // Día actual
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    // Mes actual
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);

    // Filtrar movimientos
    const movsHoy = movs.filter(m => {
        const f = new Date(m.fecha);
        return f.getFullYear() === hoy.getFullYear() && f.getMonth() === hoy.getMonth() && f.getDate() === hoy.getDate();
    });
    const movsMes = movs.filter(m => {
        const f = new Date(m.fecha);
        return f >= inicioMes && f <= finMes;
    });

    // Calcular totales
    const ingresoDiario = movsHoy.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.monto, 0);
    const gastoDiario = movsHoy.filter(m => m.tipo === 'gasto').reduce((a, b) => a + b.monto, 0);
    const ingresoMensual = movsMes.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.monto, 0);
    const gastoMensual = movsMes.filter(m => m.tipo === 'gasto').reduce((a, b) => a + b.monto, 0);

    document.getElementById('dash-ingreso-diario').textContent = formatoRD(ingresoDiario);
    document.getElementById('dash-gasto-diario').textContent = formatoRD(gastoDiario);
    document.getElementById('dash-ingreso-mensual').textContent = formatoRD(ingresoMensual);
    document.getElementById('dash-gasto-mensual').textContent = formatoRD(gastoMensual);
}

// Actualizar dashboard e inventario al cargar y tras registrar
function actualizarTodo() {
    mostrarInventario();
    actualizarDashboard();
    mostrarTablaMovimientos();
}


// --- Gráfica de movimientos (barras dobles: ingresos vs gastos por día del mes actual) ---
let graficaMovimientos = null;
function actualizarGraficaMovimientos() {
    const movs = obtenerMovimientos();
    const ahora = new Date();
    const year = ahora.getFullYear();
    const month = ahora.getMonth();
    const diasEnMes = new Date(year, month + 1, 0).getDate();
    // Inicializar arrays para cada día
    const ingresosPorDia = Array(diasEnMes).fill(0);
    const gastosPorDia = Array(diasEnMes).fill(0);
    movs.forEach(m => {
        const f = new Date(m.fecha);
        if (f.getFullYear() === year && f.getMonth() === month) {
            const dia = f.getDate() - 1;
            if (m.tipo === 'ingreso') ingresosPorDia[dia] += m.monto;
            else if (m.tipo === 'gasto') gastosPorDia[dia] += m.monto;
        }
    });
    // Etiquetas: días completos (ej: "01 Jul", "02 Jul", ...)
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const labels = Array.from({length: diasEnMes}, (_, i) => {
        const dia = (i+1).toString().padStart(2, '0');
        return `${dia} ${meses[month]}`;
    });
    const ctx = document.getElementById('grafica-movimientos').getContext('2d');
    if (graficaMovimientos) graficaMovimientos.destroy();
    graficaMovimientos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: ingresosPorDia,
                    backgroundColor: 'rgba(0, 184, 148, 0.8)',
                    borderRadius: 8,
                    maxBarThickness: 24,
                },
                {
                    label: 'Gastos',
                    data: gastosPorDia,
                    backgroundColor: 'rgba(255, 71, 87, 0.8)',
                    borderRadius: 8,
                    maxBarThickness: 24,
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    labels: { font: { size: 16, weight: 'bold' } }
                },
                title: {
                    display: true,
                    text: 'Ingresos y Gastos del Mes',
                    font: { size: 20, weight: 'bold' },
                    color: '#222'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            label += context.parsed.y.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' });
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Día del Mes', font: { size: 14 } },
                    grid: { display: false }
                },
                y: {
                    title: { display: true, text: 'Monto (DOP)', font: { size: 14 } },
                    beginAtZero: true,
                    grid: { color: '#eee' }
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutBounce'
            }
        }
    });
}

function actualizarTodo() {
    mostrarInventario();
    actualizarDashboard();
    mostrarTablaMovimientos();
    actualizarGraficaMovimientos();
}

document.addEventListener('DOMContentLoaded', actualizarTodo);

// Actualizar dashboard tras registrar movimientos o inventario

const formMov = document.getElementById('form-movimiento');
if(formMov) formMov.addEventListener('submit', function() {
    setTimeout(actualizarGraficaMovimientos, 100);
});

if(formInv) formInv.addEventListener('submit', actualizarDashboard);
