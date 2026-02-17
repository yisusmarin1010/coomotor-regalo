# 📄 Vista Previa de Documentos - COOMOTOR

## ✅ Implementación Completada

Se ha implementado un sistema completo de **vista previa de documentos** antes de subirlos al servidor. Esto mejora significativamente la experiencia del usuario y reduce errores.

---

## 🎯 Características Implementadas

### 1. **Vista Previa Automática**
- Al seleccionar un archivo, se muestra automáticamente una vista previa
- Funciona para PDFs e imágenes (PNG, JPG, JPEG)
- Validación en tiempo real del tamaño y tipo de archivo

### 2. **Preview de Imágenes**
- Muestra la imagen completa con dimensiones reales
- Información de tamaño y resolución
- Botón para ver en tamaño completo (modal)
- Bordes y sombras elegantes

### 3. **Preview de PDFs**
- Icono visual del documento PDF
- Nombre del archivo
- Botón para abrir en nueva ventana
- Información sobre el tamaño del archivo

### 4. **Validaciones Automáticas**
- ✅ Tamaño máximo: 5MB
- ✅ Tipos permitidos: PDF, PNG, JPG, JPEG
- ✅ Alertas visuales si hay errores
- ✅ Limpieza automática si el archivo no es válido

### 5. **Información del Archivo**
- Nombre completo del archivo
- Tamaño en MB con 2 decimales
- Icono según el tipo de archivo
- Botón para cambiar/limpiar el archivo

---

## 📁 Archivos Modificados/Creados

### Nuevos Archivos:
1. **`sistema-regalos/css/document-preview.css`**
   - Estilos para la vista previa
   - Animaciones suaves
   - Responsive design
   - Efectos hover

### Archivos Modificados:
1. **`sistema-regalos/js/documentos.js`**
   - Función `previsualizarDocumento(input)`
   - Función `previsualizarPDF(archivo, container)`
   - Función `previsualizarImagen(archivo, container)`
   - Función `abrirPDFEnNuevaVentana()`
   - Función `verImagenCompleta()`
   - Función `limpiarPreview()`

2. **`sistema-regalos/dashboards/empleado.html`**
   - Agregado link al CSS de preview

---

## 🚀 Cómo Funciona

### Flujo del Usuario:

1. **Usuario hace clic en "Subir Documentos"**
   - Se abre el modal de subida

2. **Usuario selecciona un archivo**
   - Se dispara el evento `onchange` del input
   - Se llama a `previsualizarDocumento(this)`

3. **Validación Automática**
   - Se verifica el tamaño (máx 5MB)
   - Se verifica el tipo (PDF, PNG, JPG)
   - Si falla, se muestra alerta y se limpia el input

4. **Mostrar Preview**
   - **Si es imagen**: Se muestra la imagen con dimensiones
   - **Si es PDF**: Se muestra icono y opción de abrir en nueva ventana

5. **Usuario puede:**
   - Ver la imagen en tamaño completo (modal)
   - Abrir el PDF en nueva ventana
   - Cambiar el archivo (botón "Cambiar archivo")
   - Continuar con la subida

---

## 💻 Código de Ejemplo

### HTML del Input (ya implementado):
```html
<input type="file" 
       class="form-control" 
       id="archivoDocumento" 
       accept=".pdf,.png,.jpg,.jpeg" 
       required 
       onchange="previsualizarDocumento(this)">
```

### Contenedor de Preview (ya implementado):
```html
<div id="previewContainer" class="mb-3" style="display: none;">
    <label class="form-label">Vista Previa:</label>
    <div id="previewContent">
        <!-- Aquí se muestra la preview -->
    </div>
    <div class="d-flex justify-content-between align-items-center mt-2">
        <small class="text-muted" id="fileInfo"></small>
        <button type="button" class="btn btn-sm btn-outline-danger" 
                onclick="limpiarPreview()">
            <i class="bi bi-x-circle me-1"></i>Cambiar archivo
        </button>
    </div>
</div>
```

---

## 🎨 Estilos Visuales

### Características de Diseño:
- ✨ Animaciones suaves al aparecer
- 🎯 Bordes redondeados y sombras elegantes
- 📱 Totalmente responsive
- 🌈 Colores consistentes con el tema COOMOTOR
- ⚡ Efectos hover en botones e imágenes

### Colores Utilizados:
- **Azul primario**: `#2563eb` (botones y acentos)
- **Rojo**: `#dc2626` (PDF y alertas de error)
- **Verde**: `#15803d` (validación exitosa)
- **Gris claro**: `#f8fafc` (fondos)

---

## 📱 Responsive Design

### Desktop (> 768px):
- Preview con ancho máximo de 400px
- Botones en línea
- Información completa visible

### Mobile (< 768px):
- Preview adaptado al ancho de pantalla
- Botones apilados verticalmente
- Texto más pequeño pero legible

---

## 🔧 Funciones Principales

### 1. `previsualizarDocumento(input)`
**Propósito**: Función principal que maneja la preview
**Parámetros**: 
- `input` - El elemento input[type="file"]

**Proceso**:
1. Obtiene el archivo seleccionado
2. Valida tamaño y tipo
3. Muestra información del archivo
4. Llama a la función específica (PDF o imagen)

### 2. `previsualizarPDF(archivo, container)`
**Propósito**: Muestra preview de archivos PDF
**Características**:
- Icono grande de PDF
- Nombre del archivo
- Botón para abrir en nueva ventana
- Guarda el data URL en `window.currentPDFDataURL`

### 3. `previsualizarImagen(archivo, container)`
**Propósito**: Muestra preview de imágenes
**Características**:
- Muestra la imagen completa
- Calcula y muestra dimensiones
- Redimensiona si es muy grande (máx 400px)
- Botón para ver en tamaño completo
- Guarda el data URL en `window.currentImageDataURL`

### 4. `limpiarPreview()`
**Propósito**: Limpia el preview y permite seleccionar otro archivo
**Acciones**:
- Limpia el input file
- Oculta el contenedor de preview
- Elimina las variables globales de data URLs

---

## ⚠️ Validaciones Implementadas

### Tamaño de Archivo:
```javascript
if (archivo.size > 5 * 1024 * 1024) {
    mostrarAlerta('danger', 'El archivo es demasiado grande. Máximo 5MB');
    input.value = '';
    return;
}
```

### Tipo de Archivo:
```javascript
const tiposPermitidos = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
if (!tiposPermitidos.includes(archivo.type)) {
    mostrarAlerta('danger', 'Tipo de archivo no permitido. Solo PDF, PNG y JPG');
    input.value = '';
    return;
}
```

---

## 🎯 Beneficios para el Usuario

1. **Evita Errores**: El usuario ve el documento antes de subirlo
2. **Ahorra Tiempo**: No necesita subir y luego darse cuenta del error
3. **Mejor UX**: Feedback visual inmediato
4. **Confianza**: El usuario sabe exactamente qué está subiendo
5. **Profesional**: La aplicación se ve más pulida y moderna

---

## 🔄 Próximas Mejoras Posibles

### Futuras Implementaciones (Opcionales):
1. **Compresión de Imágenes**: Reducir tamaño automáticamente
2. **Recorte de Imágenes**: Permitir recortar antes de subir
3. **Múltiples Archivos**: Subir varios documentos a la vez
4. **Drag & Drop**: Arrastrar archivos al área de preview
5. **Progress Bar**: Mostrar progreso de subida en tiempo real
6. **OCR**: Extraer texto de PDFs para búsqueda

---

## 📝 Notas Técnicas

### Compatibilidad:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Dependencias:
- Bootstrap 5.3.2 (ya incluido)
- Bootstrap Icons (ya incluido)
- FileReader API (nativo del navegador)

### Performance:
- Las imágenes se cargan en memoria como data URLs
- Los PDFs no se renderizan completamente (solo icono)
- Limpieza automática de memoria al cambiar archivo

---

## 🧪 Cómo Probar

### Prueba 1: Imagen Válida
1. Ir al dashboard de empleado
2. Click en "Subir Documentos"
3. Seleccionar una imagen PNG/JPG < 5MB
4. ✅ Debe mostrar la imagen con dimensiones
5. Click en "Ver tamaño completo"
6. ✅ Debe abrir modal con imagen grande

### Prueba 2: PDF Válido
1. Seleccionar un PDF < 5MB
2. ✅ Debe mostrar icono de PDF
3. Click en "Ver PDF en nueva ventana"
4. ✅ Debe abrir el PDF en nueva pestaña

### Prueba 3: Archivo Muy Grande
1. Seleccionar archivo > 5MB
2. ✅ Debe mostrar alerta de error
3. ✅ El input debe limpiarse automáticamente

### Prueba 4: Tipo Incorrecto
1. Seleccionar archivo .docx o .txt
2. ✅ Debe mostrar alerta de tipo no permitido
3. ✅ El input debe limpiarse automáticamente

### Prueba 5: Cambiar Archivo
1. Seleccionar un archivo válido
2. Click en "Cambiar archivo"
3. ✅ Debe limpiar el preview
4. ✅ Debe permitir seleccionar otro archivo

---

## 🎉 Resultado Final

Los usuarios ahora pueden:
- ✅ Ver exactamente qué documento van a subir
- ✅ Verificar que sea el archivo correcto
- ✅ Detectar errores antes de subir
- ✅ Tener una experiencia más profesional y confiable

---

## 📞 Soporte

Si encuentras algún problema o necesitas ayuda:
1. Verifica que los archivos CSS y JS estén cargando correctamente
2. Revisa la consola del navegador para errores
3. Asegúrate de que Bootstrap 5.3.2 esté incluido
4. Verifica que el input tenga el atributo `onchange="previsualizarDocumento(this)"`

---

**Implementado por**: Kiro AI Assistant  
**Fecha**: 2025  
**Versión**: 1.0  
**Estado**: ✅ Completado y Funcional
