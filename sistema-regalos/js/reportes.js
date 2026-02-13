// ============================================
// REPORTES Y ANALYTICS - SISTEMA COOMOTOR
// ============================================

let charts = {};
let datosReporte = {};

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacionAdmin();
    cargarTodosLosReportes();
});

// Verificar que sea administrador
function verificarAutenticacionAdmin() {
    const token = localStorage.getItem('coomotor_token');
    const userData = localStorage.getItem('coomotor_user');
    
    if (!token || !userData) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    const usuario = JSON.parse(userData);
    if (usuario.rol !== 'admin') {
        alert('Acceso denegado. Solo administradores pueden ver reportes.');
        window.location.href = 'empleado.html';
        return;
    }
}

// Cargar todos los reportes
async function cargarTodosLosReportes() {
    try {
        await Promise.all([
            cargarEstadisticasGenerales(),
            cargarDistribucionConductores(),
            cargarEstadisticasEdad(),
            cargarMetricasTiempo(),
            cargarTimelinePostulaciones()
        ]);
        
        // Ocultar loading
        document.getElementById('loadingOverlay').style.display = 'none';
        
    } catch (error) {
        console.error('Error al cargar reportes:', error);
        alert('Error al cargar los reportes. Por favor, recarga la página.');
    }
}

// Cargar estadísticas generales
async function cargarEstadisticasGenerales() {
    try {
        const response = await fetch('/api/admin/reportes/completo', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const stats = result.data;
                datosReporte.estadisticasGenerales = stats;
                
                // Actualizar tarjetas
                animarContador('totalEmpleados', stats.totalEmpleados || 0);
                animarContador('totalHijos', stats.totalHijos || 0);
                animarContador('totalPostulaciones', stats.totalPostulaciones || 0);
                animarContador('regalosEntregados', stats.regalosEntregados || 0);
                
                // Crear gráfico de estado de postulaciones
                crearGraficoPostulaciones(stats);
            }
        }
    } catch (error) {
        console.error('Error al cargar estadísticas generales:', error);
    }
}

// Cargar distribución por conductores
async function cargarDistribucionConductores() {
    try {
        const response = await fetch('/api/admin/reportes/distribucion-conductores', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                datosReporte.distribucionConductores = result.data;
                crearGraficoConductores(result.data);
                llenarTablaConductores(result.data);
            }
        }
    } catch (error) {
        console.error('Error al cargar distribución de conductores:', error);
    }
}

// Cargar estadísticas de edad
async function cargarEstadisticasEdad() {
    try {
        const response = await fetch('/api/admin/reportes/estadisticas-edad', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                datosReporte.estadisticasEdad = result.data;
                crearGraficoEdades(result.data);
            }
        }
    } catch (error) {
        console.error('Error al cargar estadísticas de edad:', error);
    }
}

// Cargar métricas de tiempo
async function cargarMetricasTiempo() {
    try {
        const response = await fetch('/api/admin/reportes/metricas-tiempo', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const metricas = result.data;
                datosReporte.metricasTiempo = metricas;
                
                document.getElementById('promedioHoras').textContent = 
                    Math.round(metricas.promedio_horas_aprobacion || 0);
                document.getElementById('aprobadas24h').textContent = 
                    metricas.aprobadas_24h || 0;
                document.getElementById('aprobadasMas48h').textContent = 
                    metricas.aprobadas_mas_48h || 0;
            }
        }
    } catch (error) {
        console.error('Error al cargar métricas de tiempo:', error);
    }
}

// Cargar timeline de postulaciones
async function cargarTimelinePostulaciones() {
    try {
        const response = await fetch('/api/admin/reportes/timeline-postulaciones', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                datosReporte.timeline = result.data;
                crearGraficoTimeline(result.data);
            }
        }
    } catch (error) {
        console.error('Error al cargar timeline:', error);
    }
}

// ============================================
// CREAR GRÁFICOS CON CHART.JS
// ============================================

// Gráfico de distribución por conductores (Pie Chart)
function crearGraficoConductores(data) {
    const ctx = document.getElementById('chartConductores');
    
    if (charts.conductores) {
        charts.conductores.destroy();
    }
    
    const labels = data.map(item => {
        let label = item.tipo_conductor;
        if (item.subtipo_conductor) {
            label += ` (${item.subtipo_conductor})`;
        }
        return label;
    });
    
    const valores = data.map(item => item.total_empleados);
    
    charts.conductores = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f093fb',
                    '#4facfe',
                    '#43e97b',
                    '#fa709a',
                    '#fee140',
                    '#30cfd0'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12,
                            family: 'Poppins'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de estado de postulaciones (Bar Chart)
function crearGraficoPostulaciones(stats) {
    const ctx = document.getElementById('chartPostulaciones');
    
    if (charts.postulaciones) {
        charts.postulaciones.destroy();
    }
    
    charts.postulaciones = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Pendientes', 'Aprobadas', 'Rechazadas', 'Entregadas'],
            datasets: [{
                label: 'Cantidad',
                data: [
                    stats.postulacionesPendientes || 0,
                    stats.postulacionesAprobadas || 0,
                    stats.postulacionesRechazadas || 0,
                    stats.regalosEntregados || 0
                ],
                backgroundColor: [
                    '#ffc107',
                    '#28a745',
                    '#dc3545',
                    '#007bff'
                ],
                borderColor: [
                    '#ffc107',
                    '#28a745',
                    '#dc3545',
                    '#007bff'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.y} postulaciones`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            family: 'Poppins'
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Poppins'
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de edades (Line Chart)
function crearGraficoEdades(data) {
    const ctx = document.getElementById('chartEdades');
    
    if (charts.edades) {
        charts.edades.destroy();
    }
    
    // Ordenar por edad
    data.sort((a, b) => a.edad - b.edad);
    
    charts.edades = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => `${item.edad} años`),
            datasets: [
                {
                    label: 'Total Hijos',
                    data: data.map(item => item.cantidad),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Con Postulación',
                    data: data.map(item => item.con_postulacion),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Aprobadas',
                    data: data.map(item => item.aprobadas),
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 15,
                        font: {
                            family: 'Poppins'
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            family: 'Poppins'
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Poppins'
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de timeline (Area Chart)
function crearGraficoTimeline(data) {
    const ctx = document.getElementById('chartTimeline');
    
    if (charts.timeline) {
        charts.timeline.destroy();
    }
    
    // Ordenar por fecha
    data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => {
                const fecha = new Date(item.fecha);
                return fecha.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
            }),
            datasets: [
                {
                    label: 'Total Postulaciones',
                    data: data.map(item => item.total_postulaciones),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Aprobadas',
                    data: data.map(item => item.aprobadas),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Rechazadas',
                    data: data.map(item => item.rechazadas),
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 15,
                        font: {
                            family: 'Poppins'
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            family: 'Poppins'
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Poppins'
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// TABLA DE CONDUCTORES
// ============================================

function llenarTablaConductores(data) {
    const tbody = document.getElementById('tablaConductores');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay datos disponibles</td></tr>';
        return;
    }
    
    let html = '';
    data.forEach(item => {
        const efectividad = item.total_postulaciones > 0 
            ? ((item.postulaciones_aprobadas / item.total_postulaciones) * 100).toFixed(1)
            : 0;
        
        html += `
            <tr>
                <td><strong>${item.tipo_conductor}</strong></td>
                <td>${item.subtipo_conductor || '-'}</td>
                <td class="text-center">${item.total_empleados}</td>
                <td class="text-center">${item.total_hijos}</td>
                <td class="text-center">${item.total_postulaciones}</td>
                <td class="text-center"><span class="badge bg-success">${item.postulaciones_aprobadas}</span></td>
                <td class="text-center"><span class="badge bg-primary">${item.regalos_entregados}</span></td>
                <td class="text-center">
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar ${efectividad >= 75 ? 'bg-success' : efectividad >= 50 ? 'bg-warning' : 'bg-danger'}" 
                             role="progressbar" 
                             style="width: ${efectividad}%"
                             aria-valuenow="${efectividad}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                            ${efectividad}%
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// ============================================
// UTILIDADES
// ============================================

// Animar contadores
function animarContador(elementId, valorFinal) {
    const elemento = document.getElementById(elementId);
    if (!elemento) return;
    
    const duracion = 1000;
    const pasos = 50;
    const incremento = valorFinal / pasos;
    let contador = 0;
    let paso = 0;
    
    const intervalo = setInterval(() => {
        paso++;
        contador = Math.min(Math.round(incremento * paso), valorFinal);
        elemento.textContent = contador;
        
        if (paso >= pasos) {
            clearInterval(intervalo);
            elemento.textContent = valorFinal;
        }
    }, duracion / pasos);
}

// Exportar reporte
async function exportarReporte() {
    try {
        const response = await fetch('/api/admin/reportes/exportar?formato=json', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('coomotor_token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_coomotor_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            mostrarNotificacion('success', 'Reporte exportado exitosamente');
        } else {
            mostrarNotificacion('error', 'Error al exportar reporte');
        }
    } catch (error) {
        console.error('Error al exportar:', error);
        mostrarNotificacion('error', 'Error al exportar reporte');
    }
}

// Mostrar notificación
function mostrarNotificacion(tipo, mensaje) {
    const alertClass = tipo === 'success' ? 'alert-success' : 'alert-danger';
    const icono = tipo === 'success' ? 'check-circle' : 'exclamation-triangle';
    
    const alert = document.createElement('div');
    alert.className = `alert ${alertClass} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alert.style.zIndex = '9999';
    alert.innerHTML = `
        <i class="bi bi-${icono} me-2"></i>
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}
