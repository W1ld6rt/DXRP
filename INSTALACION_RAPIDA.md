# 🚀 Instalación Rápida - DXPR

## ⚡ Instalación en 3 pasos

### 1. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2. Ejecutar la aplicación
```bash
python start.py
```

### 3. Abrir en el navegador
- **Local**: http://localhost:5000
- **Red**: http://[tu-ip]:5000

## 📱 Acceso móvil
Escanea el código QR que aparece en la consola

## 🎥 Configurar OBS Studio
1. Abrir OBS Studio
2. **Herramientas** > **WebSocket Server Settings**
3. ✅ Habilitar **Enable WebSocket server**
4. Puerto: `4455`
5. Contraseña: (opcional)
6. **OK**

## 🔧 Configuración OBS (opcional)
Editar `obs_config.json`:
```json
{
  "host": "localhost",
  "port": 4455,
  "password": "tu-contraseña"
}
```

## ✅ ¡Listo!
- ✅ Panel de control funcionando
- ✅ Conexión OBS configurada
- ✅ Biblia digital disponible
- ✅ Acceso móvil activo

## 🆘 Problemas comunes

### Error de dependencias
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Puerto ocupado
```bash
# Cambiar puerto en start.py o usar:
python app.py --port 5001
```

### OBS no conecta
- Verificar que OBS esté ejecutándose
- Comprobar configuración WebSocket
- Revisar firewall

### Archivos de Biblia faltantes
- Verificar que `NR94.xml` y `RV60.xml` estén en el directorio
- La funcionalidad de Biblia no estará disponible sin estos archivos

## 📞 Soporte
- **Issues**: GitHub
- **Documentación**: README.md
- **Configuración avanzada**: config.py

---

**DXPR** - Haciendo las presentaciones más fáciles y profesionales.




