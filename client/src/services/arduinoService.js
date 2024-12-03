// services/arduinoService.js
import { setConnected, setDisconnected, addData } from '../redux/arduinoSlice';

let socketInstance = null;

const startArduinoConnection = async (socket, dispatch) => {
  try {
    // Llamada a la API para iniciar la detección del Arduino
    const response = await fetch('http://localhost:5000/start-arduino');
    const data = await response.json();
    console.log(data.status);

    // Si el socket no está inicializado, lo configuramos
    if (!socketInstance) {
      socketInstance = socket;
      socketInstance.on('device_connected', (data) => {
        if (data.status === 'connected') {
          console.log(`Arduino conectado en el puerto: ${data.port}`);
          dispatch(setConnected({ connected: true, port: data.port }));
        } else if (data.status === 'disconnected') {
          console.log("Arduino desconectado.");
          dispatch(setDisconnected());
        } else if (data.data) {
          console.log(`Datos recibidos: ${data.data}`);
          // console.log(JSON.parse(data.data).voltage);
          //const parsedData = JSON.stringify(data.data); // Parsear el string a un objeto
          // console.log(parsedData);
          
          dispatch(addData(data.data));
        }
      });
    }
  } catch (error) {
    console.error('Error al iniciar la conexión con el Arduino:', error);
  }
};

// Función para limpiar el socket al desmontar el componente o cuando sea necesario
const clearSocketListeners = () => {
  if (socketInstance) {
    socketInstance.off('device_connected');
    socketInstance = null;
  }
};

export { startArduinoConnection, clearSocketListeners };
