# DXPR - Dexter Presenter Remote

Sistema de control para presentaciones en vivo con OBS Studio, diseñado para iglesias y eventos religiosos.

## ✨ Características Principales

- **Control de OBS Studio**: Cambio de escenas, inicio/parada de transmisión
- **Biblia Digital**: Navegación completa por libros, capítulos y versículos
- **Gestión de Canciones**: Sistema completo para letras de canciones con ChordPro
- **Lower Thirds**: Creación y gestión de gráficos de identificación
- **Proyección de Contenido**: Envío directo a pantallas de presentación
- **Historial**: Seguimiento de versículos y contenido utilizado
- **Interfaz Responsiva**: Funciona en desktop, tablet y móvil
- **Aplicación de Escritorio**: Versión nativa con Electron
- **Tema Oscuro/Claro**: Adaptación automática según preferencias
- **Conexión WebSocket**: Comunicación en tiempo real
- **Código QR**: Acceso rápido desde dispositivos móviles

## 🔧 Tecnologías Utilizadas

### Backend
- **Python 3.8+** con Flask
- **Flask-SocketIO** para comunicación en tiempo real
- **simpleobsws** para integración con OBS Studio
- **XML parsing** para biblias en formato Zefania

### Frontend
- **HTML5, CSS3, JavaScript ES6+**
- **Material Design 3** para la interfaz
- **WebSocket** para comunicación bidireccional
- **PWA** (Progressive Web App) capabilities
- **Lodash** para utilidades funcionales

### Desktop
- **Electron** para aplicación multiplataforma
- **Auto-updater** integrado
- **Menús nativos** del sistema operativo

## 📋 Requisitos del Sistema

- **Python 3.8+**
- **Node.js 16+** (para aplicación de escritorio)
- **OBS Studio 28.0+** con WebSocket plugin
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)

## 🚀 Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd Bi-Ble
```

### 2. Instalar dependencias de Python
```bash
pip install -r requirements.txt
```

### 3. Configurar OBS Studio
1. Abrir OBS Studio
2. Ir a **Herramientas** > **WebSocket Server Settings**
3. Habilitar **Enable WebSocket server**
4. Puerto: `4455` (por defecto)
5. Contraseña: (opcional pero recomendado)

### 4. Ejecutar la aplicación
```bash
python start.py
```

La aplicación estará disponible en `http://localhost:5000`

## 🖥️ Aplicación de Escritorio

### Instalar dependencias de Node.js
```bash
npm install
```

### Ejecutar en modo desarrollo
```bash
npm start
```

### Crear ejecutable
```bash
npm run build
```

## 📱 Acceso Móvil

1. Al ejecutar `python start.py`, aparecerá un código QR en la consola
2. Escanear con cualquier dispositivo móvil
3. Acceso completo al panel de control desde el móvil

## 📚 Estructura del Proyecto

```
DXPR/
├── 🐍 Backend Python
│   ├── app.py              # Aplicación principal Flask
│   ├── config.py           # Configuraciones
│   └── start.py            # Script de inicio
│
├── 🖥️ Desktop Electron
│   ├── electron-main.js    # Proceso principal
│   ├── electron-preload.js # Script de preload
│   └── package.json        # Configuración Node.js
│
├── 🌐 Frontend Web
│   ├── templates/          # Plantillas HTML
│   ├── static/css/         # Estilos CSS
│   ├── static/js/          # JavaScript
│   └── static/components/  # Componentes modulares
│
├── 📚 Recursos
│   ├── bibles/            # Archivos XML de biblias
│   └── projects/          # Archivos de canciones (.pro)
│
└── 📄 Configuración
    ├── requirements.txt    # Dependencias Python
    ├── obs_config.json     # Configuración OBS
    └── README.md          # Esta documentación
```

## ⚙️ Configuración

### OBS Studio
Editar `obs_config.json`:
```json
{
  "host": "localhost",
  "port": 4455,
  "password": "tu-contraseña"
}
```

### Biblias
- Formato soportado: **Zefania XML**
- Ubicación: directorio `bibles/`
- Biblias incluidas: RV60 (Español), NR94 (Italiano)

### Canciones
- Formato soportado: **ChordPro** (.pro, .chord, .chordpro)
- Ubicación: directorio `projects/`
- Editor integrado con soporte para acordes y letras

## 🎯 Funcionalidades Principales

### Control de OBS
- **Cambio de escenas** en tiempo real
- **Inicio/parada de transmisión**
- **Vista previa** de escena actual
- **Estado de conexión** visual

### Biblia Digital
- **Navegación** por testamentos, libros y capítulos
- **Búsqueda inteligente** de versículos
- **Proyección directa** a OBS
- **Historial** de versículos recientes
- **Soporte multi-idioma** (Español/Italiano)

### Gestión de Canciones
- **Editor ChordPro** integrado
- **Organización** por slides y secciones
- **Transposición** automática de acordes
- **Plantillas** de visualización
- **Arreglos personalizados**

### Lower Thirds
- **Creación** de gráficos de identificación
- **Personalización** de texto y estilo
- **Proyección** directa a OBS

## 🔧 Desarrollo

### Estructura Modular
El proyecto utiliza una arquitectura modular con:
- **Componentes reutilizables** en JavaScript
- **Sistema de eventos** centralizado
- **Estado global** sincronizado
- **Utilidades compartidas** con Lodash

### Estándares de Código
- **ESLint** para JavaScript
- **PEP 8** para Python
- **Material Design 3** para UI/UX
- **Semantic versioning**

## 🆘 Solución de Problemas

### OBS no conecta
1. Verificar que OBS Studio esté ejecutándose
2. Comprobar configuración WebSocket en OBS
3. Revisar firewall y puertos
4. Verificar `obs_config.json`

### Puerto ocupado
```bash
python app.py --port 5001
```

### Archivos de Biblia faltantes
- Descargar biblias en formato Zefania XML
- Colocar en directorio `bibles/`
- Reiniciar la aplicación

### Errores de dependencias
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## 📞 Soporte y Contribución

- **Issues**: Reportar problemas en GitHub
- **Documentación**: Consultar archivos en `/docs`
- **Contribuciones**: Pull requests bienvenidos

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles.

---

**DXPR** - Haciendo las presentaciones más fáciles y profesionales.
