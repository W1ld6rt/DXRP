#!/usr/bin/env python3
"""
DXPR - Dexter Presenter Remote
Script de inicio para configurar y ejecutar la aplicación
"""

import sys
import json
import socket
from pathlib import Path

def print_banner():
    """Imprime el banner de la aplicación"""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   ███████╗ ██╗  ██╗██████╗ ██████╗                           ║
    ║   ██╔═══██╗╚██╗██╔╝██╔══██╗██╔══██╗                          ║
    ║   ██║   ██║ ╚███╔╝ ██████╔╝██████╔╝                          ║
    ║   ██║   ██║ ██╔██╗ ██╔═══╝ ██╔══██╗                          ║
    ║   ███████╔╝██╔╝ ██╗██║     ██║  ██║                          ║
    ║   ╚══════╝ ╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝                          ║
    ║                                                              ║
    ║           Dexter Presenter Remote                            ║
    ║           Sistema de Control para Presentaciones             ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)

def check_python_version():
    """Verifica la versión de Python"""
    if sys.version_info < (3, 8):
        print("❌ Error: Se requiere Python 3.8 o superior")
        print(f"   Versión actual: {sys.version}")
        sys.exit(1)
    print(f"✅ Python {sys.version.split()[0]} - OK")

def check_dependencies():
    """Verifica las dependencias instaladas"""
    required_packages = [
        'flask', 'flask_socketio', 'eventlet', 'simpleobsws', 'qrcode'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Faltan dependencias: {', '.join(missing_packages)}")
        print("   Ejecuta: pip install -r requirements.txt")
        return False
    
    print("✅ Dependencias - OK")
    return True

def check_bible_files():
    """Verifica que los archivos de la Biblia estén presentes"""
    bible_files = ['NR94.xml', 'RV60.xml']
    missing_files = []
    
    for file in bible_files:
        if not Path(file).exists():
            missing_files.append(file)
    
    if missing_files:
        print(f"⚠️  Archivos de Biblia faltantes: {', '.join(missing_files)}")
        print("   La funcionalidad de Biblia no estará disponible")
        return False
    
    print("✅ Archivos de Biblia - OK")
    return True

def get_local_ip():
    """Obtiene la IP local del sistema"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

def create_default_config():
    """Crea la configuración por defecto si no existe"""
    config_file = Path('obs_config.json')
    
    if not config_file.exists():
        default_config = {
            "host": "localhost",
            "port": 4455,
            "password": ""
        }
        
        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=2, ensure_ascii=False)
            print("✅ Configuración OBS creada")
        except Exception as e:
            print(f"⚠️  No se pudo crear la configuración: {e}")
    else:
        print("✅ Configuración OBS - OK")

def show_network_info():
    """Muestra información de red"""
    local_ip = get_local_ip()
    
    print("\n🌐 Información de Red:")
    print(f"   IP Local: {local_ip}")
    print("   Puerto: 5000")
    print("   URL Local: http://localhost:5000")
    print(f"   URL Red: http://{local_ip}:5000")
    
    print("\n📱 Acceso Móvil:")
    print("   Escanea el código QR que aparecerá al iniciar la aplicación")

def show_obs_instructions():
    """Muestra instrucciones para configurar OBS"""
    print("\n🎥 Configuración OBS Studio:")
    print("   1. Abrir OBS Studio")
    print("   2. Ir a Herramientas > WebSocket Server Settings")
    print("   3. Habilitar 'Enable WebSocket server'")
    print("   4. Puerto: 4455 (por defecto)")
    print("   5. Establecer contraseña (opcional)")
    print("   6. Guardar configuración")

def main():
    """Función principal"""
    print_banner()
    
    print("🔍 Verificando sistema...")
    check_python_version()
    
    if not check_dependencies():
        print("\n💡 Para instalar dependencias:")
        print("   pip install -r requirements.txt")
        sys.exit(1)
    
    check_bible_files()
    create_default_config()
    
    show_network_info()
    show_obs_instructions()
    
    print("\n🚀 Iniciando DXPR...")
    print("   Presiona Ctrl+C para detener")
    print("=" * 60)
    
    try:
        # Importar y ejecutar la aplicación
        from app import app, socketio
        
        local_ip = get_local_ip()
        print("\n🔹 La aplicación está corriendo en:")
        print(f"   http://{local_ip}:5000 🔹\n")
        
        socketio.run(
            app, 
            host='0.0.0.0',
            port=5000,
            debug=True,
            allow_unsafe_werkzeug=True
        )
        
    except KeyboardInterrupt:
        print("\n\n👋 DXPR detenido")
    except Exception as e:
        print(f"\n❌ Error al iniciar la aplicación: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
