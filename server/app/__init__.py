from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

socketio = SocketIO()  # Configura SocketIO sin definir los CORS aquí

def create_app():
    app = Flask(__name__)
    # Configura CORS para todas las rutas con acceso total
    CORS(app, resources={r"/*": {"origins": "*"}})
    socketio.init_app(app, cors_allowed_origins="*")  # Define los CORS para SocketIO aquí

    from .routes import main
    app.register_blueprint(main)

    # Asegura que se incluya el encabezado de tipo de contenido en las respuestas
    app.config['CORS_HEADERS'] = 'Content-Type'

    return app



# from flask import Flask
# from flask_cors import CORS
# from flask_socketio import SocketIO

# socketio = SocketIO()  # Configura SocketIO sin definir los CORS aquí

# def create_app():
#     app = Flask(__name__)
#     CORS(app, resources={r"/*": {"origins": "*"}})  # Configura CORS para todas las rutas
#     socketio.init_app(app, cors_allowed_origins="*")  # Define los CORS para SocketIO aquí

#     from .routes import main
#     app.register_blueprint(main)

#     app.config['CORS_HEADERS'] = 'Content-Type'
#     app.config['CORS_HEADERS'] = 'Content-Type'


#     return app

# # from flask import Flask
# # from flask_cors import CORS
# # from flask_socketio import SocketIO
# # import serial
# # import time
# # import threading
# # from serial.tools import list_ports

# # socketio = SocketIO(cors_allowed_origins="*")

# # def create_app():
# #     app = Flask(__name__)
# #     CORS(app)
# #     socketio.init_app(app)  # Inicializa socketio aquí.

# #     from .routes import main  # Importar rutas aquí después de inicializar socketio
# #     app.register_blueprint(main)

# #     return app


# # # import threading
# # # from flask import Flask, Blueprint
# # # from flask_cors import CORS
# # # from flask_socketio import SocketIO
# # # import serial
# # # from serial.tools import list_ports
# # # import time

# # # # Inicializa SocketIO y Flask
# # # socketio = SocketIO(cors_allowed_origins="*")
# # # main = Blueprint('main', __name__)

# # # def create_app():
# # #     app = Flask(__name__)
# # #     CORS(app)
# # #     socketio.init_app(app)
# # #     app.register_blueprint(main)

# # #     # Inicia el hilo para detectar y leer datos del Arduino
# # #     thread = threading.Thread(target=detect_and_read_arduino)
# # #     thread.daemon = True
# # #     thread.start()

# # #     return app

# # # def detect_and_read_arduino():
# # #     """Detecta el puerto del Arduino y lee los datos."""
# # #     arduino = None
# # #     port_selected = None

# # #     while not arduino:
# # #         # Buscar el puerto donde está el Arduino
# # #         ports = list_ports.comports()
# # #         for port in ports:
# # #             port_selected = port.device
# # #             try:
# # #                 arduino = serial.Serial(port_selected, 2000000, timeout=1)
# # #                 print(f"Dispositivo conectado en el puerto: {port_selected}")
# # #                 socketio.emit('device_connected', {'status': 'connected', 'port': port_selected})
# # #                 break
# # #             except serial.SerialException as e:
# # #                 print(f"Error al conectar al puerto {port.device}: {e}")
# # #                 arduino = None
# # #                 port_selected = None

# # #         if arduino:
# # #             while arduino:
# # #                 try:
# # #                     # Lee la línea del puerto serial y envía los datos vía SocketIO
# # #                     data = arduino.readline().decode('utf-8').strip()
# # #                     if data:
# # #                         print(f"Datos recibidos: {data}")
# # #                         socketio.emit('arduino_data', {'data': data})
# # #                 except serial.SerialException:
# # #                     print("Conexión perdida. Intentando reconectar...")
# # #                     socketio.emit('device_connected', {'status': 'disconnected', 'port': port_selected})
# # #                     arduino.close()
# # #                     arduino = None
# # #                 time.sleep(0.1)
# # #         else:
# # #             print("Arduino no encontrado. Reintentando en 5 segundos...")
# # #             time.sleep(5)

# # from flask import Flask
# # from flask_cors import CORS
# # from flask_socketio import SocketIO
# # from .routes import main
# # import serial
# # import time
# # import threading
# # from serial.tools import list_ports
# # from app import socketio


# # socketio = SocketIO(cors_allowed_origins="*")


# # def create_app():
# #     app = Flask(__name__)
# #     CORS(app)
# #     socketio.init_app(app)
# #     app.register_blueprint(main)
# #     # Inicializar SocketIO con la app
# #     # socketio.init_app(app)

# #     # Inicia el hilo para detectar y leer datos del Arduino
# #     ##threading.Thread(target=detect_and_read_arduino, daemon=True).start()

# #     return app

# # arduino_connected = False
# # current_serial = None
# # serial_connection = None

# # def detect_and_read_arduino():
# #     global arduino_connected, current_serial, serial_connection

# #     while True:
# #         if not arduino_connected:
# #             print("Buscando dispositivos Arduino...")
# #             ports = list_ports.comports()
# #             for port in ports:
# #                 try:
# #                     print(f"Intentando conectar al puerto: {port.device}")
# #                     # Establecer conexión con el Arduino
# #                     serial_connection = serial.Serial(port.device, 2000000, timeout=1)
# #                     current_serial = port.device
# #                     arduino_connected = True
# #                     socketio.emit('device_connected', {'status': 'connected', 'port': current_serial})
# #                     print(f"Arduino conectado: {current_serial}")

# #                     # Bucle para leer datos mientras el Arduino esté conectado
# #                     while arduino_connected:
# #                         read_serial_data()
# #                 except serial.SerialException:
# #                     print(f"No se pudo conectar al puerto: {port.device}")
# #                     arduino_connected = False
# #                     current_serial = None
# #                     serial_connection = None
# #                     continue  # Continuar con el siguiente puerto

# #         # Espera antes de volver a intentar la detección si ya está desconectado
# #         time.sleep(5)

# # def read_serial_data():
# #     global arduino_connected, serial_connection

# #     try:
# #         if serial_connection.in_waiting > 0:
# #             # Leer línea completa del buffer de recepción
# #             data = serial_connection.readline().decode('utf-8').strip()
# #             if data:  # Si los datos no están vacíos
# #                 print(f"Datos recibidos: {data}")
# #                 socketio.emit('device_connected', {'data': data})  # Emitir datos al cliente
# #         else:
# #             print("Esperando datos...")  # Opcional, para monitorear el flujo de datos
# #         time.sleep(0.05)  # Pausa mínima para asegurar estabilidad en el proceso de lectura
# #     except serial.SerialException as e:
# #         print(f"Error leyendo del puerto: {e}")
# #         socketio.emit('device_connected', {'status': 'disconnected', 'port': current_serial})
# #         arduino_connected = False  # Cambiar a desconectado si ocurre un error


# # # from flask import Flask
# # # from flask_cors import CORS
# # # from flask_socketio import SocketIO
# # # from .routes import main
# # # import serial
# # # import time
# # # import threading
# # # from serial.tools import list_ports

# # # socketio = SocketIO(cors_allowed_origins="*")

# # # def create_app():
# # #     app = Flask(__name__)
# # #     CORS(app)
    
# # #     socketio.init_app(app)
# # #     app.register_blueprint(main)

# # #     # Inicia el hilo para detectar Arduino
# # #     threading.Thread(target=detect_and_read_arduino, daemon=True).start()

# # #     return app

# # # arduino_connected = False
# # # current_serial = None
# # # serial_connection = None

# # # def detect_and_read_arduino():
# # #     global arduino_connected, current_serial, serial_connection

# # #     while True:
# # #         if not arduino_connected:
# # #             print("Buscando dispositivos Arduino...")
# # #             ports = list_ports.comports()
# # #             for port in ports:
# # #                 try:
# # #                     print(f"Intentando conectar al puerto: {port.device}")
# # #                     # Establecer conexión con el Arduino
# # #                     serial_connection = serial.Serial(port.device, 2000000, timeout=1)
# # #                     current_serial = port.device
# # #                     arduino_connected = True
# # #                     socketio.emit('device_connected', {'status': 'connected', 'port': current_serial})
# # #                     print(f"Arduino conectado: {current_serial}")

# # #                     # Bucle para leer datos mientras el Arduino esté conectado
# # #                     while arduino_connected:  # Mantener en este bucle mientras esté conectado
# # #                         try:
# # #                             if serial_connection.in_waiting > 0:  # Si hay datos disponibles
# # #                                 data = serial_connection.readline().decode('utf-8').strip()
# # #                                 print(f"Datos recibidos: {data}")
# # #                                 socketio.emit('device_connected', {'data': data})  # Emitir datos recibidos al cliente
# # #                             else:
# # #                                 print("Esperando datos...")
# # #                             time.sleep(0.1)  # Pausa corta para evitar sobrecargar el CPU
# # #                         except serial.SerialException as e:
# # #                             print(f"Error leyendo del puerto: {e}")
# # #                             arduino_connected = False  # Cambiar a desconectado si hay un error
# # #                             break  # Salir del bucle de lectura

# # #                 except serial.SerialException:
# # #                     print(f"No se pudo conectar al puerto: {port.device}")
# # #                     arduino_connected = False
# # #                     current_serial = None
# # #                     serial_connection = None
# # #                     continue  # Continuar con el siguiente puerto

# # #         # Espera un tiempo antes de volver a buscar el Arduino si no está conectado
# # #         time.sleep(5)  # Pausa antes de volver a intentar la detección si ya está desconectado
