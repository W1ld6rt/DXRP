# Contributing to DXPR

¡Gracias por tu interés en contribuir a DXPR! Este documento te guiará a través del proceso de contribución.

## 🚀 Cómo Contribuir

### 1. Fork del Repositorio
1. Ve a [https://github.com/ccere/dxpr](https://github.com/ccere/dxpr)
2. Haz clic en el botón "Fork" en la esquina superior derecha
3. Clona tu fork localmente:
   ```bash
   git clone https://github.com/TU_USUARIO/dxpr.git
   cd dxpr
   ```

### 2. Configurar el Entorno de Desarrollo
1. Instala las dependencias de Python:
   ```bash
   pip install -r requirements.txt
   ```

2. Instala las dependencias de Node.js:
   ```bash
   npm install
   ```

3. Configura OBS Studio (opcional para desarrollo):
   - Instala OBS Studio
   - Habilita WebSocket en Herramientas > WebSocket Server Settings
   - Configura la contraseña en `obs_config.json`

### 3. Crear una Rama para tu Cambio
```bash
git checkout -b feature/nombre-de-tu-feature
# o
git checkout -b fix/nombre-del-fix
```

### 4. Hacer Cambios
- Escribe código limpio y bien documentado
- Sigue las convenciones de estilo del proyecto
- Añade tests si es posible
- Actualiza la documentación según sea necesario

### 5. Commit y Push
```bash
git add .
git commit -m "feat: añadir nueva funcionalidad"
git push origin feature/nombre-de-tu-feature
```

### 6. Crear un Pull Request
1. Ve a tu fork en GitHub
2. Haz clic en "New Pull Request"
3. Selecciona la rama principal del repositorio original
4. Describe tus cambios en detalle
5. Envía el PR

## 📝 Convenciones de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (espacios, punto y coma, etc.)
- `refactor:` Refactorización de código
- `test:` Añadir o modificar tests
- `chore:` Cambios en build, configuraciones, etc.

## 🧪 Testing

Antes de enviar un PR, asegúrate de que:

1. **Python**: La aplicación se ejecuta sin errores
   ```bash
   python start.py
   ```

2. **JavaScript**: No hay errores de linting
   ```bash
   npm run lint
   ```

3. **Funcionalidad**: Prueba las funciones principales:
   - Navegación entre vistas
   - Funcionalidad de biblia
   - Gestión de canciones
   - Conexión con OBS

## 🐛 Reportar Bugs

Si encuentras un bug:

1. Busca en los issues existentes para evitar duplicados
2. Crea un nuevo issue usando la plantilla de bug
3. Incluye:
   - Descripción clara del problema
   - Pasos para reproducir
   - Información del entorno
   - Logs relevantes

## 💡 Solicitar Características

Para solicitar nuevas características:

1. Busca en los issues existentes
2. Crea un nuevo issue usando la plantilla de feature request
3. Describe el caso de uso y la prioridad

## 📚 Recursos Útiles

- [README.md](README.md) - Documentación principal
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Socket.IO Documentation](https://socket.io/docs/)

## 🤝 Código de Conducta

- Sé respetuoso y constructivo
- Mantén las discusiones enfocadas en el código
- Ayuda a otros contribuyentes
- Celebra las contribuciones de otros

## 📞 Contacto

Si tienes preguntas o necesitas ayuda:

- Crea un issue en GitHub
- Únete a nuestras discusiones
- Contacta al mantenedor principal

¡Gracias por contribuir a hacer DXPR mejor! 🎉
