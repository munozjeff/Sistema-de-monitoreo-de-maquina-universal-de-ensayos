from app import create_app

app = create_app()

if __name__ == '__main__':
    from app import socketio  # Mover la importación aquí para evitar circular import
    socketio.run(app, debug=True)


# from app import create_app

# app = create_app()

# if __name__ == "__main__":
#     app.run(debug=True)

