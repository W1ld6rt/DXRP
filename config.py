"""
DXPR - Configuración de la aplicación
"""

import os
from pathlib import Path

# Configuración base
class Config:
    # Configuración de la aplicación
    SECRET_KEY = (os.environ.get('SECRET_KEY') or 
                  'dxpr-secret-key-change-in-production')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Configuración del servidor
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 5000))
    
    # Configuración de OBS
    OBS_HOST = os.environ.get('OBS_HOST', 'localhost')
    OBS_PORT = int(os.environ.get('OBS_PORT', 4455))
    OBS_PASSWORD = os.environ.get('OBS_PASSWORD', '')
    
    # Configuración de archivos
    BIBLE_FILES = {
        'it': 'NR94.xml',
        'es': 'RV60.xml'
    }
    
    # Configuración de logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE', 'app.log')
    
    # Configuración de WebSocket
    SOCKETIO_ASYNC_MODE = 'eventlet'
    SOCKETIO_CORS_ALLOWED_ORIGINS = "*"
    
    # Configuración de PWA
    PWA_NAME = "DXPR - Presenter Remote"
    PWA_DESCRIPTION = "Sistema de control para presentaciones en vivo"
    PWA_THEME_COLOR = "#6750a4"
    PWA_BACKGROUND_COLOR = "#fffbfe"
    
    # Configuración de UI
    UI_STATE = {
        "collapsed_bibbia": True,
        "lower_third_open": False,
        "display_hidden": True,
    }
    
    # Configuración de historial
    MAX_HISTORY_ITEMS = 20
    
    # Configuración de búsqueda
    SEARCH_MIN_LENGTH = 2
    SEARCH_MAX_RESULTS = 6

class DevelopmentConfig(Config):
    """Configuración para desarrollo"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(Config):
    """Configuración para producción"""
    DEBUG = False
    LOG_LEVEL = 'WARNING'
    
    # En producción, usar variables de entorno para secretos
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY debe estar configurada en producción")

class TestingConfig(Config):
    """Configuración para testing"""
    TESTING = True
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

# Diccionario de configuraciones
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Obtiene la configuración según el entorno"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])

def load_obs_config():
    """Carga la configuración de OBS desde archivo"""
    config_file = Path('obs_config.json')
    
    if config_file.exists():
        try:
            import json
            with open(config_file, 'r', encoding='utf-8') as f:
                obs_config = json.load(f)
            
            # Actualizar configuración con valores del archivo
            Config.OBS_HOST = obs_config.get('host', Config.OBS_HOST)
            Config.OBS_PORT = int(obs_config.get('port', Config.OBS_PORT))
            Config.OBS_PASSWORD = obs_config.get('password', Config.OBS_PASSWORD)
            
            return obs_config
        except Exception as e:
            print(f"Error cargando configuración OBS: "
                  f"{e}")
    
    return {
        'host': Config.OBS_HOST,
        'port': Config.OBS_PORT,
        'password': Config.OBS_PASSWORD
    }

def save_obs_config(host, port, password):
    """Guarda la configuración de OBS en archivo"""
    config_file = Path('obs_config.json')
    
    try:
        import json
        obs_config = {
            'host': host,
            'port': int(port),
            'password': password
        }
        
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(obs_config, f, indent=2, ensure_ascii=False)
        
        # Actualizar configuración en memoria
        Config.OBS_HOST = host
        Config.OBS_PORT = int(port)
        Config.OBS_PASSWORD = password
        
        return True
    except Exception as e:
        print(f"Error guardando configuración OBS: {e}")
        return False
