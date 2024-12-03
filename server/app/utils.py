import os
import json
from flask import request, jsonify

def save_config( variable_name, data):
    # Obtener el nombre de la variable y los datos desde el JSON del cuerpo de la solicitud
    # data = request.get_json()
    # variable_name = data.get("variable_name")
    content = data

    if not variable_name or not content:
        return jsonify({"error": "Debe incluir 'variable_name' y 'data' en el cuerpo de la solicitud"}), 400

    # Crear el directorio 'data' si no existe
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)

    # Definir la ruta completa para el archivo JSON
    file_path = os.path.join(data_dir, f"{variable_name}.json")

    # Guardar los datos en el archivo
    with open(file_path, 'w') as json_file:
        json.dump(content, json_file)

    return jsonify({"status": "Archivo guardado exitosamente", "file": file_path}), 200

def load_config(variable_name):
    # Definir la ruta completa para el archivo JSON
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    file_path = os.path.join(data_dir, f"{variable_name}.json")

    # Verificar si el archivo existe
    if not os.path.exists(file_path):
        return jsonify({"error": "El archivo no existe"}), 404

    # Leer los datos del archivo JSON
    with open(file_path, 'r') as json_file:
        content = json.load(json_file)

    return jsonify({"status": "Archivo cargado exitosamente", "data": content}), 200
