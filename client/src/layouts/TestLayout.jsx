import React, { useEffect, useState } from 'react';
import MaterialTestForm from '../components/MaterialTestForm/MaterialTestForm';
import { clearSocketListeners, startArduinoConnection } from '../services/arduinoService';
import useFetch from '../customHooks/useFetch';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import RealTimeChart from '../components/RealTimeChart/RealTimeChart';
import axios from 'axios';

const socket = io('http://localhost:5000'); // Cambia la URL según sea necesario

export const TestLayout = () => {
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(true);
  const { data, error, loading, fetchData } = useFetch('http://localhost:5000/stop-arduino');
  const { data: testData } = useSelector((state) => state.arduino); // Obtener datos del Arduino desde Redux
  const dispatch = useDispatch();

  const sendForm = (data) => {
    setShowForm(false);
    setFormData(data); // Guardar datos del formulario
    startArduinoConnection(socket, dispatch); // Iniciar conexión con Arduino
  };

  const handleFinalize = async () => {
    try {
      const response = await axios.post(
        'http://localhost:5000/export-test-data', // Endpoint para generar el Excel
        {
          form_data: formData, // Datos del formulario
          test_data: testData, // Datos del Arduino
        },
        { responseType: 'blob' } // Importante para manejar archivos binarios
      );

      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'datos_test.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error al exportar los datos:', error);
    }
  };

  useEffect(() => {
    return () => {
      clearSocketListeners();
      fetchData(); // Detener Arduino al desmontar el componente
    };
  }, []);

  return (
    <>
      {showForm && <MaterialTestForm sendForm={sendForm} />}
      {!showForm && (
        <div>
          <RealTimeChart formData={formData} />
          {/* <button onClick={handleFinalize} style={{position:"absolute", right:"10px",bottom:"10px", marginTop: '20px', padding: '10px', backgroundColor: '#5DADE2', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Finalizar y Descargar Excel
          </button> */}
        </div>
      )}
    </>
  );
};



// import React, { useEffect, useState } from 'react'
// import MaterialTestForm from '../components/MaterialTestForm/MaterialTestForm'
// import { clearSocketListeners, startArduinoConnection } from '../services/arduinoService'
// import useFetch from '../customHooks/useFetch'
// import { io } from 'socket.io-client';
// import { useDispatch } from 'react-redux';
// import RealTimeChart from '../components/RealTimeChart/RealTimeChart';

// const socket = io('http://localhost:5000'); // Cambia la URL según sea necesario

// export const TestLayout = () => {
//   const [formData, setFormData] = useState({})
//   const [showForm, setShowForm] = useState(true)
//   const { data, error, loading, fetchData } = useFetch("http://localhost:5000/stop-arduino");
//   const  dispatch  = useDispatch();

//   const sendForm = (data) => {
//     setShowForm(false)
//     setFormData(data)
//     // Llama al servicio para iniciar la conexión al Arduino
//     startArduinoConnection(socket, dispatch);

//   }
//   useEffect(() => {
//     return () => {
//       clearSocketListeners();
//       fetchData();
//     };
//   }, [])
//   return (
//     <>
//       {showForm && <MaterialTestForm sendForm={sendForm}/>}
//       {!showForm && <RealTimeChart/>}
//     </>
//   )
// }
