# app/arduino.py
import threading
import serial
from serial.tools import list_ports
import time
import json
from .utils import load_config

arduino_connected = False
current_serial = None
serial_connection = None
arduino_thread = None  # Variable para el hilo de conexión al Arduino
stop_thread = False  # Variable para controlar el hilo de conexión

# Función para detectar y leer datos del Arduino
def detect_and_read_arduino(socketio):
    global arduino_connected, current_serial, serial_connection, stop_thread, timestamp
    timestamp = 0
    
    
    while not stop_thread:
        if not arduino_connected:
            print("Buscando dispositivos Arduino...")
            ports = list_ports.comports()
            for port in ports:
                try:
                    print(f"Intentando conectar al puerto: {port.device}")
                    serial_connection = serial.Serial(port.device, 2000000, timeout=1)
                    current_serial = port.device
                    arduino_connected = True
                    socketio.emit('device_connected', {'status': 'connected', 'port': current_serial})
                    print(f"Arduino conectado: {current_serial}")

                    while arduino_connected and not stop_thread:
                        read_serial_data(socketio)
                except serial.SerialException:
                    print(f"No se pudo conectar al puerto: {port.device}")
                    arduino_connected = False
                    current_serial = None
                    serial_connection = None
                    continue
        time.sleep(5)

def read_serial_data(socketio):
    global arduino_connected, serial_connection, timestamp  # Añadir timestamp aquí

    try:
        if serial_connection.in_waiting > 0:
            data = serial_connection.readline().decode('utf-8').strip()
            if data:
                #print(f"Datos recibidos: {data}")
                try:
                    # Convierte la cadena JSON en un diccionario
                    data_dict = json.loads(data)
                    
                    # Actualiza el timestamp para cada dato recibido
                    data_dict['timestamp'] = timestamp
                    timestamp += 100  # Incrementa el timestamp
                    print(f"Datos recibidos: {data_dict}")
                    # Envía el dato con timestamp
                    socketio.emit('device_connected', {'data': data_dict})
                except json.JSONDecodeError as e:
                    print(f"Error de decodificación JSON: {e}")
                    print(f"Cadena recibida no válida: {data}")
        else:
            # print("Esperando datos...")
            pass
        time.sleep(0.05)
    except serial.SerialException as e:
        print(f"Error leyendo del puerto: {e}")
        socketio.emit('device_connected', {'status': 'disconnected', 'port': current_serial})
        arduino_connected = False



# Función para iniciar el hilo de conexión con el Arduino
def start_arduino_thread(socketio):
    global arduino_thread, stop_thread  # Añadir parámetros aquí
    stop_thread = False  # Resetear la señal de parada
    if arduino_thread is None or not arduino_thread.is_alive():  # Verifica si ya existe un hilo activo
        arduino_thread = threading.Thread(target=detect_and_read_arduino, args=(socketio,))
        arduino_thread.daemon = True
        arduino_thread.start()

# Función para detener el hilo de conexión con el Arduino
def stop_arduino_thread():
    global stop_thread, arduino_connected, current_serial, serial_connection
    stop_thread = True
    arduino_connected = False
    current_serial = None
    if serial_connection:
        serial_connection.close()
        serial_connection = None
    print("Hilo de conexión con Arduino detenido.")



# # app/arduino.py
# import threading
# import serial
# from serial.tools import list_ports
# import time

# arduino_connected = False
# current_serial = None
# serial_connection = None
# arduino_thread = None  # Variable para el hilo de conexión al Arduino
# stop_thread = False  # Variable para controlar el hilo de conexión

# # Función para detectar y leer datos del Arduino
# def detect_and_read_arduino(socketio):
#     global arduino_connected, current_serial, serial_connection, stop_thread

#     while not stop_thread:
#         if not arduino_connected:
#             print("Buscando dispositivos Arduino...")
#             ports = list_ports.comports()
#             for port in ports:
#                 try:
#                     print(f"Intentando conectar al puerto: {port.device}")
#                     serial_connection = serial.Serial(port.device, 2000000, timeout=1)
#                     current_serial = port.device
#                     arduino_connected = True
#                     socketio.emit('device_connected', {'status': 'connected', 'port': current_serial})
#                     print(f"Arduino conectado: {current_serial}")

#                     while arduino_connected and not stop_thread:
#                         read_serial_data(socketio)
#                 except serial.SerialException:
#                     print(f"No se pudo conectar al puerto: {port.device}")
#                     arduino_connected = False
#                     current_serial = None
#                     serial_connection = None
#                     continue
#         time.sleep(5)

# # Función para leer datos seriales del Arduino
# def read_serial_data(socketio):
#     global arduino_connected, serial_connection

#     try:
#         if serial_connection.in_waiting > 0:
#             data = serial_connection.readline().decode('utf-8').strip()
#             if data:
#                 print(f"Datos recibidos: {data}")
#                 data['timestamp'] = time.time()  # Agregar el timestamp dentro de data
#                 socketio.emit('device_connected', {'data': data})
#         else:
#             print("Esperando datos...")
#         time.sleep(0.05)
#     except serial.SerialException as e:
#         print(f"Error leyendo del puerto: {e}")
#         socketio.emit('device_connected', {'status': 'disconnected', 'port': current_serial})
#         arduino_connected = False

# # Función para iniciar el hilo de conexión con el Arduino
# def start_arduino_thread(socketio):
#     global arduino_thread, stop_thread
#     stop_thread = False  # Resetear la señal de parada
#     if arduino_thread is None or not arduino_thread.is_alive():  # Verifica si ya existe un hilo activo
#         arduino_thread = threading.Thread(target=detect_and_read_arduino, args=(socketio,))
#         arduino_thread.daemon = True
#         arduino_thread.start()

# # Función para detener el hilo de conexión con el Arduino
# def stop_arduino_thread():
#     global stop_thread, arduino_connected, current_serial, serial_connection
#     stop_thread = True
#     arduino_connected = False
#     current_serial = None
#     if serial_connection:
#         serial_connection.close()
#         serial_connection = None
#     print("Hilo de conexión con Arduino detenido.")



# # app/arduino.py
# import threading
# import serial
# from serial.tools import list_ports
# import time

# arduino_connected = False
# current_serial = None
# serial_connection = None
# arduino_thread = None  # Variable para el hilo de conexión al Arduino
# stop_thread = False  # Variable para controlar el hilo de conexión

# # Función para detectar y leer datos del Arduino
# def detect_and_read_arduino(socketio):
#     global arduino_connected, current_serial, serial_connection

#     while True:
#         if not arduino_connected:
#             print("Buscando dispositivos Arduino...")
#             ports = list_ports.comports()
#             for port in ports:
#                 try:
#                     print(f"Intentando conectar al puerto: {port.device}")
#                     serial_connection = serial.Serial(port.device, 2000000, timeout=1)
#                     current_serial = port.device
#                     arduino_connected = True
#                     socketio.emit('device_connected', {'status': 'connected', 'port': current_serial})
#                     print(f"Arduino conectado: {current_serial}")

#                     while arduino_connected:
#                         read_serial_data(socketio)
#                 except serial.SerialException:
#                     print(f"No se pudo conectar al puerto: {port.device}")
#                     arduino_connected = False
#                     current_serial = None
#                     serial_connection = None
#                     continue
#         time.sleep(5)

# # Función para leer datos seriales del Arduino
# def read_serial_data(socketio):
#     global arduino_connected, serial_connection

#     try:
#         if serial_connection.in_waiting > 0:
#             data = serial_connection.readline().decode('utf-8').strip()
#             if data:
#                 print(f"Datos recibidos: {data}")
#                 socketio.emit('device_connected', {'data': data})
#         else:
#             print("Esperando datos...")
#         time.sleep(0.05)
#     except serial.SerialException as e:
#         print(f"Error leyendo del puerto: {e}")
#         socketio.emit('device_connected', {'status': 'disconnected', 'port': current_serial})
#         arduino_connected = False

# # Función para iniciar el hilo de conexión con el Arduino
# def start_arduino_thread(socketio):
#     global arduino_thread
#     if arduino_thread is None or not arduino_thread.is_alive():  # Verifica si ya existe un hilo activo
#         arduino_thread = threading.Thread(target=detect_and_read_arduino, args=(socketio,))
#         arduino_thread.daemon = True
#         arduino_thread.start()


# # # app/arduino.py
# # import threading
# # import serial
# # from serial.tools import list_ports
# # import time

# # arduino_connected = False
# # current_serial = None
# # serial_connection = None

# # # Función para detectar y leer datos del Arduino
# # def detect_and_read_arduino(socketio):
# #     global arduino_connected, current_serial, serial_connection

# #     while True:
# #         if not arduino_connected:
# #             print("Buscando dispositivos Arduino...")
# #             ports = list_ports.comports()
# #             for port in ports:
# #                 try:
# #                     print(f"Intentando conectar al puerto: {port.device}")
# #                     serial_connection = serial.Serial(port.device, 2000000, timeout=1)
# #                     current_serial = port.device
# #                     arduino_connected = True
# #                     socketio.emit('device_connected', {'status': 'connected', 'port': current_serial})
# #                     print(f"Arduino conectado: {current_serial}")

# #                     while arduino_connected:
# #                         read_serial_data(socketio)
# #                 except serial.SerialException:
# #                     print(f"No se pudo conectar al puerto: {port.device}")
# #                     arduino_connected = False
# #                     current_serial = None
# #                     serial_connection = None
# #                     continue
# #         time.sleep(5)

# # # Función para leer datos seriales del Arduino
# # def read_serial_data(socketio):
# #     global arduino_connected, serial_connection

# #     try:
# #         if serial_connection.in_waiting > 0:
# #             data = serial_connection.readline().decode('utf-8').strip()
# #             if data:
# #                 print(f"Datos recibidos: {data}")
# #                 socketio.emit('device_connected', {'data': data})
# #         else:
# #             print("Esperando datos...")
# #         time.sleep(0.05)
# #     except serial.SerialException as e:
# #         print(f"Error leyendo del puerto: {e}")
# #         socketio.emit('device_connected', {'status': 'disconnected', 'port': current_serial})
# #         arduino_connected = False

# # # Función para iniciar el hilo de conexión con el Arduino
# # def start_arduino_thread(socketio):
# #     if not arduino_connected:
# #         arduino_thread = threading.Thread(target=detect_and_read_arduino, args=(socketio,))
# #         arduino_thread.daemon = True
# #         arduino_thread.start()
