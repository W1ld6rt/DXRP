import asyncio
import simpleobsws
from simpleobsws import WebSocketClient
from simpleobsws import Request

from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename
import xml.etree.ElementTree as ET
import os
import socket
import qrcode
import json
from pathlib import Path
import logging
import shutil
import re

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Logger específico para errores de cliente
client_logger = logging.getLogger('client_errors')
client_logger.setLevel(logging.ERROR)
client_handler = logging.FileHandler('client_errors.log')
client_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
client_logger.addHandler(client_handler)

def obtener_ip_local():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

# Configuración OBS
CFG_PATH = Path("obs_config.json")
default_obs_cfg = {"host": "localhost", "port": 4455, "password": ""}
obs_cfg = default_obs_cfg.copy()

if CFG_PATH.exists():
    try:
        obs_cfg.update(json.loads(CFG_PATH.read_text(encoding="utf-8")))
    except Exception as e:
        logger.error(f"Error loading OBS config: {e}")

app = Flask(__name__)
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    logger=True, 
    engineio_logger=True
)

# Configuración para carga de archivos
UPLOAD_FOLDER = 'bibles'
ALLOWED_EXTENSIONS = {'xml'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Crear directorio de biblias si no existe
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configuración para archivos .PRO
PROJECTS_FOLDER = 'projects'
os.makedirs(PROJECTS_FOLDER, exist_ok=True)

# Estado UI global
ui_state = {
    "collapsed_bibbia": True,
    "lower_third_open": False,
    "display_hidden": True,
}

ultimo_versiculo = None
historial = []

# Función para conectar a OBS con manejo de errores
async def conectar_obs():
    try:
        host = obs_cfg.get('host', 'localhost')
        port = int(obs_cfg.get('port', 4455))
        url = f"ws://{host}:{port}"
        password = obs_cfg.get('password') or None
        ws = WebSocketClient(url=url, password=password)
        await ws.connect()
        await ws.wait_until_identified()
        return ws
    except Exception as e:
        logger.error(f"Error connecting to OBS: {e}")
        return None

# Cargar biblias
def cargar_biblia(ruta):
    if not os.path.exists(ruta):
        raise FileNotFoundError(f"No se encontró el archivo: {ruta}")
    return ET.parse(ruta).getroot()

# Estructura global para almacenar múltiples biblias
bibles_data = {}

def load_bible_by_code(bible_code, file_path):
    """Carga una biblia específica por código"""
    try:
        root = cargar_biblia(file_path)
        bible_data = {}
        
        for book in root.findall('BIBLEBOOK'):
            bnumber = book.attrib['bnumber']
            bname = book.attrib['bname']
            if bnumber not in bible_data:
                bible_data[bnumber] = {"name": bname, "capitulos": {}}
            
            for chapter in book.findall('CHAPTER'):
                cnum = chapter.attrib['cnumber']
                if cnum not in bible_data[bnumber]["capitulos"]:
                    bible_data[bnumber]["capitulos"][cnum] = {}
                
                for verse in chapter.findall('VERS'):
                    vnum = verse.attrib['vnumber']
                    texto = (verse.text or "").strip()
                    bible_data[bnumber]["capitulos"][cnum][vnum] = texto
        
        bibles_data[bible_code] = bible_data
        return bible_data
    except Exception as e:
        logger.error(f"Error loading Bible {bible_code}: {e}")
        return None

try:
    # Cargar biblias por defecto
    load_bible_by_code('NR94', 'NR94.xml')
    load_bible_by_code('RV60', 'RV60.xml')
    
    # Mantener compatibilidad con el formato anterior para la biblia principal
    biblia = bibles_data.get('RV60', {})
except Exception as e:
    logger.error(f"Error loading Bible data: {e}")
    biblia = {}
    bibles_data = {}

# Eventos Socket.IO
@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected: {request.sid}")
    emit('ui_estado', ui_state)
    if ultimo_versiculo:
        emit('versiculo', ultimo_versiculo)
    if historial:
        emit('actualizar_historial', historial)

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('client_error')
def handle_client_error(data):
    """Recibe y registra errores del cliente"""
    try:
        message = data.get('message', 'Error desconocido')
        stack = data.get('stack', '')
        url = data.get('url', '')
        timestamp = data.get('timestamp', '')
        error_type = data.get('type', 'error')
        
        # Registrar en el log específico de errores de cliente
        client_logger.error(
            f"Error de cliente [{error_type}] - {message}\n" 
            f"URL: {url}\n" 
            f"Timestamp: {timestamp}\n" 
            f"Stack: {stack}\n"
        )
        
        # Registrar en el log general
        logger.error(f"Cliente {request.sid} reportó un error: {message}")
        
        # Confirmar recepción del error
        emit('error_logged', {'status': 'success'}, to=request.sid)
    except Exception as e:
        logger.error(f"Error al procesar error de cliente: {e}")
        emit('error_logged', {'status': 'error', 'message': str(e)}, to=request.sid)

@socketio.on('ui_pedir_estado')
def ui_pedir_estado():
    emit('ui_estado', ui_state, to=request.sid)
    if ultimo_versiculo:
        emit('versiculo', ultimo_versiculo, to=request.sid)
    if historial:
        emit('actualizar_historial', historial, to=request.sid)

@socketio.on('ui_set_bibbia')
def ui_set_bibbia(data):
    collapsed = bool(data.get('collapsed'))
    ui_state['collapsed_bibbia'] = collapsed
    emit('ui_bibbia_cambiada', {'collapsed': collapsed}, broadcast=True, include_self=True)

@socketio.on('ui_set_lower_third')
def ui_set_lower_third(data):
    is_open = data.get('open')
    if isinstance(is_open, bool):
        ui_state['lower_third_open'] = is_open
        emit('ui_lower_third_cambiada', {'open': is_open}, broadcast=True, include_self=True)

@socketio.on('ui_set_display_hidden')
def ui_set_display_hidden(data):
    hidden = bool(data.get('hidden'))
    ui_state['display_hidden'] = hidden
    emit('ui_display_hidden_cambiado', {'hidden': hidden}, broadcast=True, include_self=True)

@socketio.on('get_obs_cfg')
def get_obs_cfg():
    emit('obs_cfg', obs_cfg, to=request.sid)

@socketio.on('set_obs_cfg')
def set_obs_cfg(data):
    try:
        host = (data.get('host') or '').strip()
        port = int(data.get('port') or 4455)
        password = data.get('password') or ""
        obs_cfg.update({"host": host or "localhost", "port": port, "password": password})
        CFG_PATH.write_text(json.dumps(obs_cfg, ensure_ascii=False, indent=2), encoding="utf-8")
        emit('obs_cfg', obs_cfg, broadcast=True)
        emit('obs_cfg_success', {"message": "Configuración guardada"}, broadcast=True)
    except Exception as e:
        logger.error(f"Error saving OBS config: {e}")
        emit('obs_cfg_error', {"error": str(e)}, to=request.sid)

@socketio.on('pedir_escenas')
def pedir_escenas():
    async def run():
        try:
            ws = await conectar_obs()
            if not ws:
                emit('obs_error', {"error": "No se pudo conectar a OBS"}, to=request.sid)
                return
                
            res = await ws.call(Request('GetSceneList'))
            res_streaming = await ws.call(Request('GetStreamStatus'))
            await ws.disconnect()

            escenas = res.responseData.get('scenes', [])
            activa = res.responseData.get('currentProgramSceneName', '')
            streaming = res_streaming.responseData.get('outputActive', False)

            emit('lista_escenas', {
                'escenas': [e['sceneName'] for e in escenas],
                'activa': activa,
                'streaming': streaming
            }, to=request.sid)
        except Exception as e:
            logger.error(f"Error getting scenes: {e}")
            emit('obs_error', {"error": str(e)}, to=request.sid)
    
    asyncio.run(run())

@socketio.on('cambiar_escena')
def cambiar_escena(nombre):
    async def run():
        try:
            ws = await conectar_obs()
            if not ws:
                emit('obs_error', {"error": "No se pudo conectar a OBS"}, to=request.sid)
                return
                
            await ws.call(Request('SetCurrentProgramScene', {'sceneName': nombre}))
            res = await ws.call(Request('GetSceneList'))
            res_streaming = await ws.call(Request('GetStreamStatus'))
            await ws.disconnect()
            
            escenas = res.responseData.get('scenes', [])
            activa = res.responseData.get('currentProgramSceneName', '')
            streaming = res_streaming.responseData.get('outputActive', False)
            
            emit('lista_escenas', {
                'escenas': [e['sceneName'] for e in escenas],
                'activa': activa,
                'streaming': streaming
            }, broadcast=True)
            emit('escena_activada', nombre, broadcast=True)
        except Exception as e:
            logger.error(f"Error changing scene: {e}")
            emit('obs_error', {"error": str(e)}, to=request.sid)
    
    asyncio.run(run())

@socketio.on('toggle_streaming')
def toggle_streaming():
    async def run():
        try:
            ws = await conectar_obs()
            if not ws:
                emit('obs_error', {"error": "No se pudo conectar a OBS"}, to=request.sid)
                return
                
            res = await ws.call(Request('GetStreamStatus'))
            streaming = res.responseData.get('outputActive', False)

            if streaming:
                await ws.call(Request('StopStream'))
            else:
                await ws.call(Request('StartStream'))
            
            res2 = await ws.call(Request('GetStreamStatus'))
            streaming_now = res2.responseData.get('outputActive', False)

            escena_res = await ws.call(Request('GetSceneList'))
            escenas = escena_res.responseData.get('scenes', [])
            activa = escena_res.responseData.get('currentProgramSceneName', '')
            
            emit('lista_escenas', {
                'escenas': [e['sceneName'] for e in escenas],
                'activa': activa,
                'streaming': streaming_now
            }, broadcast=True)
            
            await ws.disconnect()
        except Exception as e:
            logger.error(f"Error toggling streaming: {e}")
            emit('obs_error', {"error": str(e)}, to=request.sid)
    
    asyncio.run(run())

@socketio.on('versiculo')
def manejar_versiculo(data):
    global ultimo_versiculo
    ultimo_versiculo = data
    emit('versiculo', data, broadcast=True)

@socketio.on('ajustar')
def manejar_ajuste(data):
    payload = []
    if isinstance(data, dict):
        payload = [data]
    elif isinstance(data, list):
        payload = data
    emit('ajustar', payload, broadcast=True)

@socketio.on('historial')
def manejar_historial(data):
    global historial
    cambiado = False

    if isinstance(data, list):
        if historial != []:
            historial = []
            cambiado = True
    elif isinstance(data, str):
        if data not in historial:
            historial.insert(0, data)
            if len(historial) > 8:
                historial.pop()
            cambiado = True

    if cambiado or isinstance(data, list):
        emit('actualizar_historial', historial, broadcast=True)

# Rutas Flask
@app.route('/')
def index():
    return render_template('control-modular.html')

@app.route('/test')
def test_buttons():
    return send_from_directory('.', 'test-buttons.html')

@app.route('/display')
def display():
    return render_template('projection-display.html')

@app.route('/names')
def names():
    return render_template('projection-names.html')

@app.route('/bibbia')
def bibbia():
    return render_template('projection-display.html')

@app.route('/canti')
def canti():
    return render_template('projection-songs.html')

@app.route('/sottopancia')
def sottopancia():
    return render_template('projection-lower-third.html')


# ========== RUTAS PARA ARCHIVOS .PRO ==========

@app.route('/api/projects/list')
def list_pro_files():
    """Lista todos los archivos .PRO disponibles en el directorio projects"""
    try:
        pro_files = []
        projects_path = os.path.join(os.getcwd(), PROJECTS_FOLDER)
        
        if os.path.exists(projects_path):
            for filename in os.listdir(projects_path):
                if filename.lower().endswith(('.pro', '.chord', '.chordpro')):
                    file_path = os.path.join(projects_path, filename)
                    file_stats = os.stat(file_path)
                    pro_files.append({
                        'name': filename,
                        'path': f'/api/projects/file/{filename}',
                        'size': file_stats.st_size,
                        'modified': file_stats.st_mtime
                    })
        
        return jsonify({
            'status': 'success',
            'files': pro_files,
            'count': len(pro_files)
        })
    except Exception as e:
        logger.error(f"Error listing PRO files: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/projects/file/<filename>')
def serve_pro_file(filename):
    """Sirve un archivo .PRO específico desde el directorio projects"""
    try:
        secure_name = secure_filename(filename)
        return send_from_directory(PROJECTS_FOLDER, secure_name)
    except Exception as e:
        logger.error(f"Error serving PRO file {filename}: {e}")
        return jsonify({
            'status': 'error',
            'message': 'File not found'
        }), 404

@app.route('/api/projects/upload', methods=['POST'])
def upload_pro_file():
    """Permite subir archivos .PRO al directorio projects"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No file provided'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'status': 'error',
                'message': 'No file selected'
            }), 400
        
        # Validar extensión
        if not file.filename.lower().endswith(('.pro', '.chord', '.chordpro', '.txt')):
            return jsonify({
                'status': 'error',
                'message': 'Invalid file type. Only .pro, .chord, .chordpro, and .txt files are allowed'
            }), 400
        
        # Guardar archivo
        secure_name = secure_filename(file.filename)
        file_path = os.path.join(PROJECTS_FOLDER, secure_name)
        file.save(file_path)
        
        logger.info(f"PRO file uploaded: {secure_name}")
        return jsonify({
            'status': 'success',
            'message': f'File {secure_name} uploaded successfully',
            'filename': secure_name
        })
    except Exception as e:
        logger.error(f"Error uploading PRO file: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500



@app.route('/templates/<path:filename>')
def serve_template(filename):
    """Servir archivos de templates para carga dinámica"""
    return send_from_directory('templates', filename)

@app.route('/api/libros')
def api_libros():
    try:
        # Usar la primera biblia disponible para obtener la lista de libros
        bible_data = None
        for bible_code in ['RV60', 'NR94']:
            if bible_code in bibles_data:
                bible_data = bibles_data[bible_code]
                break
        
        if not bible_data:
            return jsonify({"error": "No Bible data available"}), 500
            
        libros = [
            {"bnumber": b, "name": bible_data[b]["name"]}
            for b in sorted(bible_data, key=lambda x: int(x))
        ]
        return jsonify(libros)
    except Exception as e:
        logger.error(f"Error in api_libros: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/indice')
def api_indice():
    try:
        # Usar la primera biblia disponible para obtener la lista de libros
        bible_data = None
        for bible_code in ['RV60', 'NR94']:
            if bible_code in bibles_data:
                bible_data = bibles_data[bible_code]
                break
        
        if not bible_data:
            return jsonify({"error": "No Bible data available"}), 500
            
        libros = [
            {
                "bnumber": b,
                "nombre_it": bible_data[b]["name"].get("it", ""),
                "nombre_es": bible_data[b]["name"].get("es", "")
            }
            for b in sorted(bible_data, key=lambda x: int(x))
        ]
        return jsonify(libros)
    except Exception as e:
        logger.error(f"Error in api_indice: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/capitulos/<bnumber>')
def api_capitulos(bnumber):
    try:
        # Usar la primera biblia disponible para obtener los capítulos
        bible_data = None
        for bible_code in ['RV60', 'NR94']:
            if bible_code in bibles_data:
                bible_data = bibles_data[bible_code]
                break
        
        if not bible_data:
            return jsonify({"error": "No Bible data available"}), 500
            
        return jsonify(
            list(bible_data.get(bnumber, {}).get("capitulos", {}).keys())
        )
    except Exception as e:
        logger.error(f"Error in api_capitulos: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/versiculos/<bnumber>/<capitulo>')
def api_versiculos(bnumber, capitulo):
    try:
        # Usar la primera biblia disponible para obtener los versículos
        bible_data = None
        for bible_code in ['RV60', 'NR94']:
            if bible_code in bibles_data:
                bible_data = bibles_data[bible_code]
                break
        
        if not bible_data:
            return jsonify({"error": "No Bible data available"}), 500
            
        return jsonify(
            list(bible_data.get(bnumber, {}).get("capitulos", {}).get(capitulo, {}).keys())
        )
    except Exception as e:
        logger.error(f"Error in api_versiculos: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/versiculo/<bnumber>/<capitulo>/<versiculo>')
def api_versiculo(bnumber, capitulo, versiculo):
    try:
        # Obtener el código de biblia del parámetro de consulta
        bible_code = request.args.get('bible', 'RV60')  # Por defecto RV60
        
        # Buscar en la biblia específica
        bible_data = bibles_data.get(bible_code, {})
        if not bible_data:
            return jsonify({"error": f"Biblia {bible_code} no encontrada"}), 404
        
        versiculo_text = bible_data.get(bnumber, {}).get("capitulos", {}).get(capitulo, {}).get(versiculo)
        if versiculo_text:
            # Devolver en formato compatible con el frontend
            return jsonify({"es": versiculo_text})
        
        return jsonify({"error": "Versículo no encontrado"}), 404
    except Exception as e:
        logger.error(f"Error in api_versiculo: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/versiculo-contexto/<bnumber>/<capitulo>/<versiculo>')
def api_versiculo_contexto(bnumber, capitulo, versiculo):
    """Obtiene un versículo con contexto (±10 versículos)"""
    try:
        # Obtener el código de biblia del parámetro de consulta
        bible_code = request.args.get('bible', 'RV60')
        context_range = int(request.args.get('range', 10))  # Por defecto ±10 versículos
        
        # Buscar en la biblia específica
        bible_data = bibles_data.get(bible_code, {})
        if not bible_data:
            return jsonify({"error": f"Biblia {bible_code} no encontrada"}), 404
        
        book_data = bible_data.get(bnumber, {})
        chapter_data = book_data.get("capitulos", {}).get(capitulo, {})
        
        if not chapter_data:
            return jsonify({"error": "Capítulo no encontrado"}), 404
        
        target_verse = int(versiculo)
        verses_with_context = []
        
        # Obtener versículos en el rango especificado
        start_verse = max(1, target_verse - context_range)
        end_verse = target_verse + context_range
        
        # Obtener todos los versículos disponibles en el capítulo
        available_verses = [int(v) for v in chapter_data.keys()]
        max_verse = max(available_verses) if available_verses else target_verse
        end_verse = min(end_verse, max_verse)
        
        for verse_num in range(start_verse, end_verse + 1):
            verse_text = chapter_data.get(str(verse_num))
            if verse_text:
                verses_with_context.append({
                    "verse": verse_num,
                    "text": verse_text,
                    "is_selected": verse_num == target_verse
                })
        
        if not verses_with_context:
            return jsonify({"error": "No se encontraron versículos"}), 404
        
        return jsonify({
            "book": book_data.get("name", ""),
            "chapter": capitulo,
            "selected_verse": target_verse,
            "verses": verses_with_context
        })
        
    except Exception as e:
        logger.error(f"Error in api_versiculo_contexto: {e}")
        return jsonify({"error": str(e)}), 500

# Funciones auxiliares para manejo de biblias
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def parse_zefania_xml(file_path):
    """Parse Zefania XML format and extract bible information"""
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        # Extract bible information from XML
        bible_name = root.get('biblename', 'Unknown Bible')
        bible_code = root.get('identifier', '')
        
        # If no identifier, generate one from the name
        if not bible_code:
            bible_code = re.sub(r'[^a-zA-Z0-9]', '', bible_name.replace(' ', ''))[:10].upper()
        
        # Validate that it's a proper Zefania format
        books = root.findall('.//BIBLEBOOK')
        if not books:
            raise ValueError("Invalid Zefania XML format: No BIBLEBOOK elements found")
        
        return {
            'name': bible_name,
            'code': bible_code,
            'books_count': len(books)
        }
    except ET.ParseError as e:
        raise ValueError(f"Invalid XML format: {str(e)}")
    except Exception as e:
        raise ValueError(f"Error parsing Bible: {str(e)}")

# Nuevas rutas API para manejo de biblias
@app.route('/api/upload-bible', methods=['POST'])
def upload_bible():
    try:
        if 'bible_file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['bible_file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only XML files are allowed'}), 400
        
        # Secure the filename
        filename = secure_filename(file.filename)
        
        # Save to temporary location first
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f'temp_{filename}')
        file.save(temp_path)
        
        try:
            # Parse and validate the XML
            bible_info = parse_zefania_xml(temp_path)
            
            # Generate final filename based on bible code
            final_filename = f"{bible_info['code']}.xml"
            final_path = os.path.join(app.config['UPLOAD_FOLDER'], final_filename)
            
            # Check if bible already exists
            if os.path.exists(final_path):
                os.remove(temp_path)
                return jsonify({'error': f'Bible with code {bible_info["code"]} already exists'}), 409
            
            # Move to final location
            shutil.move(temp_path, final_path)
            
            # Load the new bible into memory
            try:
                load_bible_by_code(bible_info['code'], final_path)
                logger.info(f"Bible loaded into memory: {bible_info['name']} ({bible_info['code']})")
            except Exception as e:
                logger.warning(f"Bible uploaded but failed to load into memory: {e}")
            
            logger.info(f"Bible uploaded successfully: {bible_info['name']} ({bible_info['code']})")
            
            return jsonify({
                'message': 'Bible uploaded successfully',
                'name': bible_info['name'],
                'code': bible_info['code'],
                'filePath': final_path,
                'booksCount': bible_info['books_count']
            })
            
        except ValueError as e:
            # Remove temp file on validation error
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return jsonify({'error': str(e)}), 400
        
    except Exception as e:
        logger.error(f"Error uploading bible: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/remove-bible/<bible_code>', methods=['DELETE'])
def remove_bible(bible_code):
    try:
        # Prevent removal of default bibles
        if bible_code in ['RV60', 'NR94']:
            return jsonify({'error': 'Cannot remove default Bible translations'}), 403
        
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f'{bible_code}.xml')
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Bible not found'}), 404
        
        # Remove the file
        os.remove(file_path)
        
        # Remove from memory if loaded
        if bible_code in bibles_data:
            del bibles_data[bible_code]
            logger.info(f"Bible removed from memory: {bible_code}")
        
        logger.info(f"Bible removed successfully: {bible_code}")
        
        return jsonify({'message': 'Bible removed successfully'})
        
    except Exception as e:
        logger.error(f"Error removing bible: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/installed-bibles')
def get_installed_bibles():
    try:
        bibles = []
        
        # Add default bibles
        default_bibles = [
            {'name': 'Reina Valera 1960', 'code': 'RV60', 'isDefault': True},
            {'name': 'Nueva Reina Valera', 'code': 'NR94', 'isDefault': True}
        ]
        
        for bible in default_bibles:
            file_path = f"{bible['code']}.xml"
            if os.path.exists(file_path):
                bibles.append(bible)
        
        # Add uploaded bibles
        if os.path.exists(app.config['UPLOAD_FOLDER']):
            for filename in os.listdir(app.config['UPLOAD_FOLDER']):
                if filename.endswith('.xml'):
                    bible_code = filename[:-4]  # Remove .xml extension
                    
                    # Skip if it's a default bible
                    if bible_code in ['RV60', 'NR94']:
                        continue
                    
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    try:
                        bible_info = parse_zefania_xml(file_path)
                        bibles.append({
                            'name': bible_info['name'],
                            'code': bible_code,
                            'isDefault': False,
                            'filePath': file_path
                        })
                    except Exception as e:
                        logger.warning(f"Could not parse bible {filename}: {e}")
        
        return jsonify(bibles)
        
    except Exception as e:
        logger.error(f"Error getting installed bibles: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    ip_servidor = obtener_ip_local()
    print(f"\n🔹 La aplicación está corriendo en: http://{ip_servidor}:5000 🔹\n")
    
    # Generar código QR para el panel de control
    url_control = f"http://{ip_servidor}:5000/control"
    qr = qrcode.QRCode(border=2)
    qr.add_data(url_control)
    qr.make(fit=True)

    # Mostrar en consola como ASCII
    print("\nEscanea este código QR para acceder al panel de control:\n")
    qr.print_ascii(invert=True)
    
    socketio.run(
        app, host='0.0.0.0',
        port=5000,
        debug=True,
        allow_unsafe_werkzeug=True
    )