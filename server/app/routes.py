from flask import Blueprint, send_from_directory, jsonify, request, send_file
import os
from .arduino import start_arduino_thread, stop_arduino_thread
from app import socketio  # Mantener esta importación
from .utils import save_config,load_config  # Importa la función desde utils.py
from flask_cors import cross_origin
import pandas as pd
import io


main = Blueprint('main', __name__)

@main.route('/test')
def test_route():
    return jsonify({"message": "El servidor está funcionando correctamente!"})

@main.route('/')
@main.route('/<path:path>')
def serve_index(path=''):
    dist_dir = os.path.join(os.path.dirname(__file__), '../../client/dist')
    if path != '' and os.path.exists(os.path.join(dist_dir, path)):
        return send_from_directory(dist_dir, path)
    return send_from_directory(dist_dir, 'index.html')

@main.route('/start-arduino', methods=['GET'])
def start_arduino():
    start_arduino_thread(socketio)
    return jsonify({"status": "started"}), 200

@main.route('/stop-arduino', methods=['GET'])
def stop_arduino():
    stop_arduino_thread()
    return jsonify({"status": "stopped"}), 200

@main.route('/save-calibration-data', methods=['POST'])
@cross_origin()  # Aplica CORS a esta ruta
def save_config_route():
    print("hola")
    # Obtener el nombre de la variable y los datos desde el JSON del cuerpo de la solicitud
    data = request.get_json()
    variable_name = data.get("name")
    content = data.get("data")

    # Devuelve una respuesta JSON
    # return jsonify({"variable_name": variable_name, "content": content}), 200

    

    if not variable_name or not content:
        return jsonify({"error": "Debe incluir 'variable_name' y 'data' en el cuerpo de la solicitud"}), 400

    # Llamar a la función save_config y retornar su respuesta
    return save_config(variable_name, content)

@main.route('/load-calibration-data', methods=['GET'])
#@cross_origin()  # Aplica CORS a esta ruta

def load_config_route():
    variable_name = "calibration_data"
    return load_config(variable_name)


@main.route('/export-test-data', methods=['POST'])
@cross_origin()
def export_test_data():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se enviaron datos para exportar"}), 400

    # Datos del formulario
    form_data = data.get("form_data", {})
    # Datos de lectura del test
    test_data = data.get("test_data", [])

    # Crear DataFrame para los datos del formulario
    form_df = pd.DataFrame([form_data])

    # Crear DataFrame para los datos del test
    test_df = pd.DataFrame(test_data)

    # Guardar en un archivo Excel en memoria
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        # Escribir datos en la hoja "Formulario"
        form_df.to_excel(writer, index=False, sheet_name="Formulario", startrow=1)

        # Escribir datos en la hoja "Datos del Test"
        test_df.to_excel(writer, index=False, sheet_name="Datos del Test", startrow=1)

        # Agregar formato de tabla a ambas hojas
        workbook = writer.book
        form_sheet = writer.sheets["Formulario"]
        test_sheet = writer.sheets["Datos del Test"]

        # Definir estilos
        header_format = workbook.add_format({
            'bold': True,
            'text_wrap': True,
            'valign': 'top',
            'fg_color': '#D7E4BC',
            'border': 1
        })

        # Crear tabla en la hoja "Formulario"
        form_sheet.add_table(
            0, 0, len(form_df), len(form_df.columns) - 1,  # Rango de la tabla
            {
                'columns': [{'header': col} for col in form_df.columns],  # Encabezados
                'style': 'Table Style Medium 9'
            }
        )

        # Crear tabla en la hoja "Datos del Test"
        test_sheet.add_table(
            0, 0, len(test_df), len(test_df.columns) - 1,  # Rango de la tabla
            {
                'columns': [{'header': col} for col in test_df.columns],  # Encabezados
                'style': 'Table Style Medium 9'
            }
        )

    output.seek(0)

    # Devolver el archivo Excel al cliente
    return send_file(
        output,
        as_attachment=True,
        download_name="datos_test.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


# @main.route('/export-test-data', methods=['POST'])
# @cross_origin()
# def export_test_data():
#     data = request.get_json()
#     if not data:
#         return jsonify({"error": "No se enviaron datos para exportar"}), 400

#     # Datos del formulario
#     form_data = data.get("form_data", {})
#     # Datos de lectura del test
#     test_data = data.get("test_data", [])

#     # Crear DataFrame para los datos del formulario
#     form_df = pd.DataFrame([form_data])

#     # Crear DataFrame para los datos del test
#     test_df = pd.DataFrame(test_data)

#     # Guardar en un archivo Excel en memoria
#     output = io.BytesIO()
#     with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
#         form_df.to_excel(writer, index=False, sheet_name="Formulario")
#         test_df.to_excel(writer, index=False, sheet_name="Datos del Test")
#     output.seek(0)

#     # Devolver el archivo Excel al cliente
#     return send_file(
#         output,
#         as_attachment=True,
#         download_name="datos_test.xlsx",
#         mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
#     )



# from flask import Blueprint, send_from_directory, jsonify
# import os
# from .arduino import start_arduino_thread
# from app import socketio
# # from . import socketio  # Importar socketio desde __init__.py

# main = Blueprint('main', __name__)

# # Ruta de prueba
# @main.route('/test')
# def test_route():
#     return jsonify({"message": "El servidor está funcionando correctamente!"})

# # Ruta para servir el archivo index.html
# @main.route('/')
# @main.route('/<path:path>')
# def serve_index(path=''):
#     dist_dir = os.path.join(os.path.dirname(__file__), '../../client/dist')
#     if path != '' and os.path.exists(os.path.join(dist_dir, path)):
#         return send_from_directory(dist_dir, path)
#     return send_from_directory(dist_dir, 'index.html')
# # Ruta para iniciar el hilo de conexión con el Arduino
# # Ruta para iniciar la conexión con el Arduino
# @main.route('/start-arduino', methods=['GET'])
# def start_arduino():
#     start_arduino_thread(socketio)
#     return jsonify({"status": "started"}), 200