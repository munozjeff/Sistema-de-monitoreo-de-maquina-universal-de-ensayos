import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useDispatch, useSelector } from 'react-redux';
import { Chart, registerables } from 'chart.js';
import axios from 'axios';
import './RealTimeChart.style.css';
import { clearData } from '../../redux/arduinoSlice';

Chart.register(...registerables);

const RealTimeChart = ({ formData }) => {
  const { parameter_calibration } = useSelector((state) => state.data);
  const data = useSelector((state) => state.arduino.data);
  const [showAllData, setShowAllData] = useState(false);
  const [activeGraph, setActiveGraph] = useState('force-time');
  const [sliderValue, setSliderValue] = useState(200); // Rango dinámico para la cantidad de datos
  const [rangeMode, setRangeMode] = useState('static'); // 'static', 'dynamic', 'complete'
  const dispatch = useDispatch();
  const multiplier = 10; // Multiplicador para convertir a cm

  // Filtra los datos a mostrar basado en el rango del slider
  const displayedData = React.useMemo(() => {
    if (rangeMode === 'dynamic') {
      return data.slice(data.length - sliderValue); // Mostrar los últimos 'sliderValue' datos
    } else if (rangeMode === 'complete') {
      return data; // Mostrar todos los datos
    } else {
      return data.slice(sliderValue[0], sliderValue[1]); // Rango estático basado en el slider
    }
  }, [data, rangeMode, sliderValue]);

  // Limpia datos al montar el componente
  useEffect(() => {
    dispatch(clearData());
  }, [dispatch]);

  // Conversión de voltaje a fuerza usando parámetros de calibración
  const convertVoltage = (voltage) => {
    const m = parameter_calibration?.m || 0;
    const b = parameter_calibration?.b || 0;
    return voltage * m + b;
  };

  // Filtrar datos de distancia para evitar actualizaciones constantes
  const filteredData = React.useMemo(() => {
    if (activeGraph === 'force-distance') {
      const filtered = [];
      let lastSeenDistance = null;

      for (const item of displayedData) {
        if (item.distance !== lastSeenDistance) {
          filtered.push(item);
          lastSeenDistance = item.distance;
        }
      }
      return filtered;
    }
    return displayedData;
  }, [displayedData, activeGraph]);

  // Generar datos para las gráficas
  const forceData = filteredData.map((item) => convertVoltage(item.voltage));
  const distanceData = filteredData.map((item) => item.distance * multiplier);
  const timeLabels = filteredData.map((item) => item.timestamp / 1000);

  // Cálculo de valores máximos
  const maxForce = Math.max(...forceData);
  const maxDistance = Math.max(...distanceData);
  const maxVoltageRaw = Math.max(...filteredData.map((item) => item.voltage));

  // Configuración de datos para las gráficas
  const chartData = {
    'force-time': {
      labels: timeLabels,
      datasets: [
        {
          label: 'Fuerza (kgf)',
          data: forceData,
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 2,
          tension: 0.2,
          pointRadius: 0,
        },
      ],
    },
    'distance-time': {
      labels: timeLabels,
      datasets: [
        {
          label: 'Distancia (cm)',
          data: distanceData,
          borderColor: 'rgba(255,99,132,1)',
          borderWidth: 2,
          tension: 0.2,
          pointRadius: 0,
        },
      ],
    },
    'force-distance': {
      labels: distanceData,
      datasets: [
        {
          label: 'Fuerza (kgf)',
          data: forceData,
          borderColor: 'rgba(54,162,235,1)',
          borderWidth: 2,
          tension: 0.2,
          pointRadius: 0,
        },
      ],
    },
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: activeGraph === 'force-distance' ? 'Distancia (cm)' : 'Tiempo (s)',
        },
      },
      y: {
        title: {
          display: true,
          text:
            activeGraph === 'force-time' || activeGraph === 'force-distance'
              ? 'Fuerza (kgf)'
              : 'Distancia (cm)',
        },
      },
    },
  };

  const handleFinish = async () => {
    try {
      // Preparar los datos del test con kilogramos en lugar de voltaje
      const testData = data.map((item) => ({
        timestamp: item.timestamp / 1000, // Tiempo en segundos
        force: convertVoltage(item.voltage), // Fuerza en kgf
        distance: item.distance * multiplier, // Distancia en cm
      }));
      const payload = {
        form_data: formData, // Datos del formulario
        test_data: testData, // Datos del test convertidos
      };

      const response = await axios.post('http://localhost:5000/export-test-data', payload, {
        responseType: 'blob', // Asegurar que la respuesta sea tratada como archivo
      });

      // Crear un enlace para descargar el archivo retornado
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'test_data.xlsx'); // Nombre del archivo
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al exportar los datos:', error);
      alert('Hubo un problema al finalizar y descargar los datos.');
    }
  };

  return (
    <div className="chart-component">
      <div className="chart-container">
        <h2>Gráficas en Tiempo Real</h2>

        <div className="button-group">
          <button onClick={() => setActiveGraph('force-time')}>Fuerza vs Tiempo</button>
          <button onClick={() => setActiveGraph('distance-time')}>Distancia vs Tiempo</button>
          <button onClick={() => setActiveGraph('force-distance')}>Fuerza vs Distancia</button>
        </div>

        <div className="range-mode-selector">
          <label>Rango de Datos:</label>
          <select onChange={(e) => setRangeMode(e.target.value)} value={rangeMode}>
            <option value="static">Estático</option>
            <option value="dynamic">Dinámico</option>
            <option value="complete">Completo</option>
          </select>
        </div>

        {rangeMode === 'dynamic' && (
          <div className="slider-container">
            <label>Cantidad de Datos a Mostrar:</label>
            <input
              type="range"
              min="1"
              max={data.length}
              value={sliderValue}
              onChange={(e) => setSliderValue(e.target.value)}
            />
            <span>{sliderValue} datos</span>
          </div>
        )}

        {rangeMode === 'static' && (
          <div className="slider-container">
            <label>Rango de Datos:</label>
            <input
              type="range"
              className="range-slider"
              min="0"
              max={data.length - 1}
              value={sliderValue[0]}
              onChange={(e) => setSliderValue([+e.target.value, sliderValue[1]])}
            />
            <input
              type="range"
              className="range-slider"
              min="0"
              max={data.length - 1}
              value={sliderValue[1]}
              onChange={(e) => setSliderValue([sliderValue[0], +e.target.value])}
            />
          </div>
        )}

        {/* <button onClick={() => setShowAllData((prev) => !prev)}>
          {showAllData ? 'Mostrar últimos 200 datos' : 'Mostrar todos los datos'}
        </button> */}

        <Line
          style={{ height: '100%', width: '100%' }}
          data={chartData[activeGraph]}
          options={chartOptions}
        />
      </div>

      <div className="value-display">
        <h3>Últimos Valores</h3>
        <p><strong>Fuerza:</strong> {forceData.length ? forceData[forceData.length - 1].toFixed(3) : 'N/A'} kgf</p>
        <p><strong>Distancia:</strong> {distanceData.length ? distanceData[distanceData.length - 1].toFixed(3) : 'N/A'} cm</p>
        
        {/* Mostrar máximos obtenidos */}
        <p><strong>Máxima Fuerza:</strong> {forceData.length ? Math.max(...forceData).toFixed(3) : 'N/A'} kgf</p>
        <p><strong>Máxima Distancia:</strong> {distanceData.length ? Math.max(...distanceData).toFixed(3) : 'N/A'} cm</p>

        <button onClick={handleFinish}>Finalizar y Descargar Datos</button>
      </div>

    </div>
  );
};

export default RealTimeChart;



// import React, { useEffect, useState } from 'react';
// import { Line } from 'react-chartjs-2';
// import { useDispatch, useSelector } from 'react-redux';
// import { Chart, registerables } from 'chart.js';
// import axios from 'axios';
// import './RealTimeChart.style.css';
// import { clearData } from '../../redux/arduinoSlice';

// Chart.register(...registerables);

// const RealTimeChart = ({ formData }) => {
//   const { parameter_calibration } = useSelector((state) => state.data);
//   const data = useSelector((state) => state.arduino.data);
//   const [showAllData, setShowAllData] = useState(false);
//   const [activeGraph, setActiveGraph] = useState('force-time');
//   const [lastDistance, setLastDistance] = useState(null); // Para manejar cambios en distancia
//   const dispatch = useDispatch();
//   const multiplier = 10; // Multiplicador para convertir a cm

//   // Filtra los datos a mostrar
//   // const displayedData = showAllData ? data : data.slice(-200);
//   const displayedData = data ;

//   // Limpia datos al montar el componente
//   useEffect(() => {
//     dispatch(clearData());
//   }, [dispatch]);

//   // Conversión de voltaje a fuerza usando parámetros de calibración
//   const convertVoltage = (voltage) => {
//     const m = parameter_calibration?.m || 0;
//     const b = parameter_calibration?.b || 0;
//     return voltage * m + b;
//   };

//   // Filtrar datos de distancia para evitar actualizaciones constantes
//   const filteredData = React.useMemo(() => {
//     if (activeGraph === 'force-distance') {
//       const filtered = [];
//       let lastSeenDistance = null;

//       for (const item of data) {
//         if (item.distance !== lastSeenDistance) {
//           filtered.push(item);
//           lastSeenDistance = item.distance;
//         }
//       }
//       return filtered;
//     }
//     return displayedData;
//   }, [data, activeGraph]);

//   // Generar datos para las gráficas
//   const forceData = filteredData.map((item) => convertVoltage(item.voltage));
//   const distanceData = filteredData.map((item) => item.distance * multiplier);
//   const timeLabels = filteredData.map((item) => item.timestamp / 1000);

//   // Cálculo de valores máximos
//   const maxForce = Math.max(...forceData);
//   const maxDistance = Math.max(...distanceData);
//   const maxVoltageRaw = Math.max(...filteredData.map((item) => item.voltage));

//   // Configuración de datos para las gráficas
//   const chartData = {
//     'force-time': {
//       labels: timeLabels,
//       datasets: [
//         {
//           label: 'Fuerza (kgf)',
//           data: forceData,
//           borderColor: 'rgba(75,192,192,1)',
//           borderWidth: 2,
//           tension: 0.2,
//           pointRadius: 0,
//         },
//       ],
//     },
//     'distance-time': {
//       labels: timeLabels,
//       datasets: [
//         {
//           label: 'Distancia (cm)',
//           data: distanceData,
//           borderColor: 'rgba(255,99,132,1)',
//           borderWidth: 2,
//           tension: 0.2,
//           pointRadius: 0,
//         },
//       ],
//     },
//     'force-distance': {
//       labels: distanceData,
//       datasets: [
//         {
//           label: 'Fuerza (kgf)',
//           data: forceData,
//           borderColor: 'rgba(54,162,235,1)',
//           borderWidth: 2,
//           tension: 0.2,
//           pointRadius: 0,
//         },
//       ],
//     },
//   };

//   const chartOptions = {
//     plugins: {
//       legend: {
//         display: true,
//         position: 'top',
//       },
//     },
//     scales: {
//       x: {
//         title: {
//           display: true,
//           text: activeGraph === 'force-distance' ? 'Distancia (cm)' : 'Tiempo (s)',
//         },
//       },
//       y: {
//         title: {
//           display: true,
//           text:
//             activeGraph === 'force-time' || activeGraph === 'force-distance'
//               ? 'Fuerza (kgf)'
//               : 'Distancia (cm)',
//         },
//       },
//     },
//   };

//   const handleFinish = async () => {
//     try {
//       // Preparar los datos del test con kilogramos en lugar de voltaje
//       const testData = data.map((item) => ({
//         timestamp: item.timestamp / 1000, // Tiempo en segundos
//         force: convertVoltage(item.voltage), // Fuerza en kgf
//         distance: item.distance * multiplier, // Distancia en cm
//       }));
//       const payload = {
//         form: formData, // Datos del formulario
//         test_data: testData, // Datos del test convertidos
//       };

//       const response = await axios.post('http://localhost:5000/export-test-data', payload, {
//         responseType: 'blob', // Asegurar que la respuesta sea tratada como archivo
//       });

//       // Crear un enlace para descargar el archivo retornado
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', 'test_data.xlsx'); // Nombre del archivo
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//     } catch (error) {
//       console.error('Error al exportar los datos:', error);
//       alert('Hubo un problema al finalizar y descargar los datos.');
//     }
//   };

//   return (
//     <div className='chart-component'>
//       <div className="chart-container">
//         <h2>Gráficas en Tiempo Real</h2>

//         <div className="button-group">
//           <button onClick={() => setActiveGraph('force-time')}>Fuerza vs Tiempo</button>
//           <button onClick={() => setActiveGraph('distance-time')}>Distancia vs Tiempo</button>
//           <button onClick={() => setActiveGraph('force-distance')}>Fuerza vs Distancia</button>
//         </div>

//         <button onClick={() => setShowAllData((prev) => !prev)}>
//           {showAllData ? 'Mostrar últimos 200 datos' : 'Mostrar todos los datos'}
//         </button>

//         <Line
//           style={{ height: '100%', width: '100%' }}
//           data={chartData[activeGraph]}
//           options={chartOptions}
//         />
//       </div>

//       <div className="value-display">
//         <h3>Últimos Valores</h3>
//         <p><strong>Fuerza:</strong> {forceData.length ? forceData[forceData.length - 1].toFixed(2) : 0} kgf</p>
//         <p><strong>Distancia:</strong> {distanceData.length ? distanceData[distanceData.length - 1].toFixed(2) : 0} cm</p>

//         <h3>Valores Máximos</h3>
//         <p><strong>Máxima Fuerza:</strong> {maxForce.toFixed(2)} kgf</p>
//         <p><strong>Máxima Distancia:</strong> {maxDistance.toFixed(2)} cm</p>
//         {/* <p><strong>Voltaje Máximo:</strong> {maxVoltageRaw.toFixed(2)} V</p> */}
//       </div>

//       <div className="finish-button-container" style={{ position: "absolute", right: "10px", bottom: "10px", marginTop: '20px', padding: '10px', backgroundColor: '#5DADE2', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
//         <button className="finish-button" onClick={handleFinish}>
//           Finalizar y Exportar
//         </button>
//       </div>
//     </div>
//   );
// };

// export default RealTimeChart;


// // import React, { useEffect, useState } from 'react';
// // import { Line } from 'react-chartjs-2';
// // import { useDispatch, useSelector } from 'react-redux';
// // import { Chart, registerables } from 'chart.js';
// // import axios from 'axios';
// // import './RealTimeChart.style.css';
// // import { clearData } from '../../redux/arduinoSlice';

// // Chart.register(...registerables);

// // const RealTimeChart = ({ formData }) => {
// //   const { parameter_calibration } = useSelector((state) => state.data);
// //   const data = useSelector((state) => state.arduino.data);
// //   const [showAllData, setShowAllData] = useState(false);
// //   const [activeGraph, setActiveGraph] = useState('force-time');
// //   const dispatch = useDispatch();

// //   const displayedData = showAllData ? data : data.slice(-200);

// //   // Reiniciar estado data al montar el componente
// //   useEffect(() => {
// //     dispatch(clearData());
// //   }, [dispatch]);

// //   const convertVoltage = (voltage) => {
// //     const m = parameter_calibration?.m || 0;
// //     const b = parameter_calibration?.b || 0;
// //     return voltage * m + b;
// //   };

// //   const forceData = displayedData.map((item) => convertVoltage(item.voltage));
// //   const distanceData = displayedData.map((item) => item.distance * 1000);
// //   const timeLabels = displayedData.map((item) => item.timestamp / 1000);

// //   // Cálculo de valores máximos
// //   const maxForce = Math.max(...forceData);
// //   const maxDistance = Math.max(...distanceData);
// //   const maxVoltageRaw = Math.max(...displayedData.map((item) => item.voltage));

// //   const chartData = {
// //     'force-time': {
// //       labels: timeLabels,
// //       datasets: [
// //         {
// //           label: 'Fuerza (kgf)',
// //           data: forceData,
// //           borderColor: 'rgba(75,192,192,1)',
// //           borderWidth: 2,
// //           tension: 0.2,
// //           pointRadius: 0,
// //         },
// //       ],
// //     },
// //     'distance-time': {
// //       labels: timeLabels,
// //       datasets: [
// //         {
// //           label: 'Distancia (cm)',
// //           data: distanceData,
// //           borderColor: 'rgba(255,99,132,1)',
// //           borderWidth: 2,
// //           tension: 0.2,
// //           pointRadius: 0,
// //         },
// //       ],
// //     },
// //     'force-distance': {
// //       labels: distanceData,
// //       datasets: [
// //         {
// //           label: 'Fuerza (kgf)',
// //           data: forceData,
// //           borderColor: 'rgba(54,162,235,1)',
// //           borderWidth: 2,
// //           tension: 0.2,
// //           pointRadius: 0,
// //         },
// //       ],
// //     },
// //   };

// //   const chartOptions = {
// //     plugins: {
// //       legend: {
// //         display: true,
// //         position: 'top',
// //       },
// //     },
// //     scales: {
// //       x: {
// //         title: {
// //           display: true,
// //           text: activeGraph === 'force-distance' ? 'Distancia (cm)' : 'Tiempo (s)',
// //         },
// //       },
// //       y: {
// //         title: {
// //           display: true,
// //           text:
// //             activeGraph === 'force-time' || activeGraph === 'force-distance'
// //               ? 'Fuerza (kgf)'
// //               : 'Distancia (cm)',
// //         },
// //       },
// //     },
// //   };

// //   const handleFinish = async () => {
// //     try {
// //       // Preparar los datos del test con kilogramos en lugar de voltaje
// //       const testData = data.map((item) => ({
// //         timestamp: item.timestamp / 1000, // Tiempo en segundos
// //         force: convertVoltage(item.voltage), // Fuerza en kgf
// //         distance: item.distance * 10, // Distancia en cm
// //       }));
// //       const payload = {
// //         form: formData, // Datos del formulario
// //         test_data: testData, // Datos del test convertidos
// //       };
  
// //       const response = await axios.post('http://localhost:5000/export-test-data', payload, {
// //         responseType: 'blob', // Asegurar que la respuesta sea tratada como archivo
// //       });
  
// //       // Crear un enlace para descargar el archivo retornado
// //       const url = window.URL.createObjectURL(new Blob([response.data]));
// //       const link = document.createElement('a');
// //       link.href = url;
// //       link.setAttribute('download', 'test_data.xlsx'); // Nombre del archivo
// //       document.body.appendChild(link);
// //       link.click();
// //       link.remove();
// //     } catch (error) {
// //       console.error('Error al exportar los datos:', error);
// //       alert('Hubo un problema al finalizar y descargar los datos.');
// //     }
// //   };
  

// //   return (
// //     <div className='chart-component'>
// //       <div className="chart-container">
// //         <h2>Gráficas en Tiempo Real</h2>

// //         <div className="button-group">
// //           <button onClick={() => setActiveGraph('force-time')}>Fuerza vs Tiempo</button>
// //           <button onClick={() => setActiveGraph('distance-time')}>Distancia vs Tiempo</button>
// //           <button onClick={() => setActiveGraph('force-distance')}>Fuerza vs Distancia</button>
// //         </div>

// //         <button onClick={() => setShowAllData((prev) => !prev)}>
// //           {showAllData ? 'Mostrar últimos 200 datos' : 'Mostrar todos los datos'}
// //         </button>

// //         <Line
// //           style={{ height: '100%', width: '100%' }}
// //           data={chartData[activeGraph]}
// //           options={chartOptions}
// //         />
// //       </div>

// //       <div className="value-display">
// //         <h3>Últimos Valores</h3>
// //         <p><strong>Fuerza:</strong> {forceData.length ? forceData[forceData.length - 1].toFixed(2) : 0} kgf</p>
// //         <p><strong>Distancia:</strong> {distanceData.length ? distanceData[distanceData.length - 1].toFixed(2) : 0} cm</p>

// //         <h3>Valores Máximos</h3>
// //         <p><strong>Máxima Fuerza:</strong> {maxForce.toFixed(2)} kgf</p>
// //         <p><strong>Máxima Distancia:</strong> {maxDistance.toFixed(2)} cm</p>
// //         <p><strong>Voltaje Máximo:</strong> {maxVoltageRaw.toFixed(2)} V</p>
// //       </div>

// //       <div className="finish-button-container" style={{position:"absolute", right:"10px",bottom:"10px", marginTop: '20px', padding: '10px', backgroundColor: '#5DADE2', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
// //         <button className="finish-button" onClick={handleFinish}>
// //           Finalizar y Exportar
// //         </button>
// //       </div>
// //     </div>
// //   );
// // };

// // export default RealTimeChart;




// // // // // components/RealTimeChart.js
// // // // import React, { useState } from 'react';
// // // // import { Line } from 'react-chartjs-2';
// // // // import { useSelector } from 'react-redux';
// // // // import { Chart, registerables } from 'chart.js';
// // // // import './RealTimeChart.style.css';

// // // // Chart.register(...registerables);

// // // // const RealTimeChart = () => {
// // // //   const { parameter_calibration } = useSelector((state) => state.data);
// // // //   const data = useSelector((state) => state.arduino.data);
// // // //   const [showAllData, setShowAllData] = useState(false);

// // // //   const displayedData = showAllData ? data : data.slice(-200);

// // // //   // Función para convertir voltaje a fuerza en kgf
// // // //   const convertVoltage = (voltage) => {
// // // //     const m = parameter_calibration?.m || 0;
// // // //     const b = parameter_calibration?.b || 0;
// // // //     return (voltage * m) + b; // Conversión a fuerza en kgf
// // // //   };

// // // //   // Obtener valores máximos
// // // //   const maxVoltageRaw = Math.max(...displayedData.map((item) => item.voltage)); // Voltaje bruto máximo
// // // //   const maxDistanceRaw = Math.max(...displayedData.map((item) => item.distance)); // Distancia en bruto máxima

// // // //   // Valores calculados
// // // //   const maxForce = Math.max(...displayedData.map((item) => convertVoltage(item.voltage))); // Fuerza máxima (kgf)
// // // //   const maxDistance = Math.max(...displayedData.map((item) => item.distance * 10)); // Distancia máxima (cm)

// // // //   // Obtener los últimos valores
// // // //   const lastVoltage = displayedData.length ? displayedData[displayedData.length - 1].voltage : 0;
// // // //   const lastDistance = displayedData.length ? displayedData[displayedData.length - 1].distance : 0;
// // // //   const lastTimestamp = displayedData.length ? displayedData[displayedData.length - 1].timestamp / 1000 : 0;

// // // //   const combinedData = {
// // // //     labels: displayedData.map((item) => item.timestamp / 1000),
// // // //     datasets: [
// // // //       {
// // // //         label: 'Fuerza (kgf)',
// // // //         data: displayedData.map((item) => convertVoltage(item.voltage)),
// // // //         fill: false,
// // // //         borderColor: 'rgba(75,192,192,1)',
// // // //         borderWidth: 2,
// // // //         tension: 0.2,
// // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'red' : 'rgba(75,192,192,1)')),
// // // //         yAxisID: 'y1',
// // // //       },
// // // //       {
// // // //         label: 'Distancia (cm)',
// // // //         data: displayedData.map((item) => item.distance * 10),
// // // //         fill: false,
// // // //         borderColor: 'rgba(255,99,132,1)',
// // // //         borderWidth: 2,
// // // //         tension: 0.2,
// // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'blue' : 'rgba(255,99,132,1)')),
// // // //         yAxisID: 'y2',
// // // //       },
// // // //     ],
// // // //   };

// // // //   const options = {
// // // //     plugins: {
// // // //       legend: {
// // // //         display: true,
// // // //         position: 'top',
// // // //         labels: {
// // // //           usePointStyle: true,
// // // //         },
// // // //         onClick: (e, legendItem) => {
// // // //           const index = legendItem.datasetIndex;
// // // //           const ci = e.chart;
// // // //           ci.getDatasetMeta(index).hidden = !ci.getDatasetMeta(index).hidden;
// // // //           ci.update();
// // // //         },
// // // //       },
// // // //     },
// // // //     scales: {
// // // //       x: {
// // // //         title: {
// // // //           display: true,
// // // //           text: 'Tiempo (s)',
// // // //         },
// // // //       },
// // // //       y1: {
// // // //         type: 'linear',
// // // //         position: 'left',
// // // //         title: {
// // // //           display: true,
// // // //           text: 'Fuerza (kgf)',
// // // //         },
// // // //       },
// // // //       y2: {
// // // //         type: 'linear',
// // // //         position: 'right',
// // // //         title: {
// // // //           display: true,
// // // //           text: 'Distancia (cm)',
// // // //         },
// // // //         grid: {
// // // //           drawOnChartArea: false,
// // // //         },
// // // //       },
// // // //     },
// // // //   };

// // // //   return (
// // // //     <div className='chart-component'>
// // // //       <div className="chart-container">
// // // //         <h2>Gráfico Combinado en Tiempo Real</h2>
// // // //         <button onClick={() => setShowAllData((prev) => !prev)}>
// // // //           {showAllData ? 'Mostrar últimos 200 datos' : 'Mostrar todos los datos'}
// // // //         </button>
// // // //         <Line style={{ height: '100%', width: '100%' }} data={combinedData} options={options} />
// // // //       </div>

// // // //       <div className="value-display">
// // // //         <h3>Últimos Valores</h3>
// // // //         <p><strong>Tiempo:</strong> {lastTimestamp.toFixed(2)} s</p>
// // // //         <p><strong>Fuerza:</strong> {convertVoltage(lastVoltage).toFixed(2)} kgf</p>
// // // //         <p><strong>Distancia:</strong> {(lastDistance * 10).toFixed(2)} cm</p>

// // // //         <h3>Valores Máximos</h3>
// // // //         <p><strong>Máxima Fuerza:</strong> {maxForce.toFixed(2)} kgf</p>
// // // //         <p><strong>Máxima Distancia:</strong> {maxDistance.toFixed(2)} cm</p>
// // // //         <p><strong>Peso Máximo (Voltaje):</strong> {maxVoltageRaw.toFixed(2)} V</p>
// // // //         <p><strong>Distancia Máxima Bruta:</strong> {maxDistanceRaw.toFixed(2)} m</p>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default RealTimeChart;


// // // // // components/RealTimeChart.js
// // // // import React, { useState } from 'react';
// // // // import { Line } from 'react-chartjs-2';
// // // // import { useSelector } from 'react-redux';
// // // // import { Chart, registerables } from 'chart.js';
// // // // import './RealTimeChart.style.css';

// // // // Chart.register(...registerables);

// // // // const RealTimeChart = () => {
// // // //   const { parameter_calibration } = useSelector((state) => state.data);
// // // //   const data = useSelector((state) => state.arduino.data);
// // // //   const [showAllData, setShowAllData] = useState(false);

// // // //   const displayedData = showAllData ? data : data.slice(-200);

// // // //   // Función para convertir voltaje a fuerza en kgf
// // // //   const convertVoltage = (voltage) => {
// // // //     // El cálculo de la fuerza se mantiene igual, ya que estamos trabajando solo en kgf
    
// // // //     const m = parameter_calibration?.m || 0;
// // // //     const b = parameter_calibration?.b || 0;
// // // //     console.log(m,b);
    
// // // //     const f = ((voltage * m ) + b)
    
// // // //     return f; // Siempre devuelve en kgf
// // // //   };

// // // //   // Obtener los últimos valores de cada variable
// // // //   const lastVoltage = displayedData.length ? displayedData[displayedData.length - 1].voltage : 0;
// // // //   const lastDistance = displayedData.length ? displayedData[displayedData.length - 1].distance : 0;
// // // //   const lastTimestamp = displayedData.length ? displayedData[displayedData.length - 1].timestamp / 1000 : 0;

// // // //   // Calcular los valores máximos de fuerza y distancia (Asegurando que maxVoltage se calcula como fuerza)
// // // //   const maxForce = Math.max(...displayedData.map((item) => convertVoltage(item.voltage))); // Aquí se cambia de maxVoltage a maxForce
// // // //   const maxDistance = Math.max(...displayedData.map((item) => item.distance));

// // // //   const combinedData = {
// // // //     labels: displayedData.map((item) => item.timestamp / 1000),
// // // //     datasets: [
// // // //       {
// // // //         label: 'Fuerza (kgf)', // Actualizado a kgf
// // // //         data: displayedData.map((item) => convertVoltage(item.voltage)),
// // // //         fill: false,
// // // //         borderColor: 'rgba(75,192,192,1)',
// // // //         borderWidth: 2,
// // // //         tension: 0.2,
// // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'red' : 'rgba(75,192,192,1)')),
// // // //         yAxisID: 'y1', // Eje izquierdo para la fuerza
// // // //       },
// // // //       {
// // // //         label: 'Distancia (cm)',
// // // //         data: displayedData.map((item) => item.distance*10),
// // // //         fill: false,
// // // //         borderColor: 'rgba(255,99,132,1)',
// // // //         borderWidth: 2,
// // // //         tension: 0.2,
// // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'blue' : 'rgba(255,99,132,1)')),
// // // //         yAxisID: 'y2', // Eje derecho para la distancia
// // // //       },
// // // //     ],
// // // //   };

// // // //   const options = {
// // // //     plugins: {
// // // //       legend: {
// // // //         display: true,
// // // //         position: 'top',
// // // //         labels: {
// // // //           usePointStyle: true,
// // // //         },
// // // //         onClick: (e, legendItem) => {
// // // //           const index = legendItem.datasetIndex;
// // // //           const ci = e.chart;
// // // //           ci.getDatasetMeta(index).hidden = !ci.getDatasetMeta(index).hidden;
// // // //           ci.update();
// // // //         },
// // // //       },
// // // //     },
// // // //     scales: {
// // // //       x: {
// // // //         title: {
// // // //           display: true,
// // // //           text: 'Tiempo (s)',
// // // //         },
// // // //       },
// // // //       y1: {
// // // //         type: 'linear',
// // // //         position: 'left',
// // // //         title: {
// // // //           display: true,
// // // //           text: 'Fuerza (kgf)', // Actualizado a kgf
// // // //         },
// // // //       },
// // // //       y2: {
// // // //         type: 'linear',
// // // //         position: 'right',
// // // //         title: {
// // // //           display: true,
// // // //           text: 'Distancia (cm)',
// // // //         },
// // // //         grid: {
// // // //           drawOnChartArea: false, // Evita que la cuadrícula del eje derecho se superponga con la del eje izquierdo
// // // //         },
// // // //       },
// // // //     },
// // // //   };

// // // //   return (
// // // //     <div className='chart-component'>
// // // //       <div className="chart-container">
// // // //         <h2>Gráfico Combinado en Tiempo Real</h2>

// // // //         {/* El selector de unidad se elimina ya que solo manejaremos kgf */}
// // // //         <button onClick={() => setShowAllData((prev) => !prev)}>
// // // //           {showAllData ? 'Mostrar últimos 200 datos' : 'Mostrar todos los datos'}
// // // //         </button>

// // // //         <Line style={{ height: '100%', width: '100%' }} data={combinedData} options={options} />
// // // //       </div>

// // // //       <div className="value-display">
// // // //         <h3>Últimos Valores</h3>
// // // //         <p><strong>Tiempo:</strong> {lastTimestamp.toFixed(2)} s</p>
// // // //         <p><strong>Fuerza:</strong> {convertVoltage(lastVoltage).toFixed(2)} kgf</p>
// // // //         <p><strong>Distancia:</strong> {lastDistance.toFixed(2)*10} cm</p>

// // // //         <h3>Valores Máximos</h3>
// // // //         <p><strong>Máxima Fuerza:</strong> {maxForce.toFixed(2)} kgf</p> {/* Cambié maxVoltage por maxForce */}
// // // //         <p><strong>Máxima Distancia:</strong> {maxDistance.toFixed(2)*10} cm</p>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default RealTimeChart;




// // // // // // components/RealTimeChart.js
// // // // // import React, { useState } from 'react';
// // // // // import { Line } from 'react-chartjs-2';
// // // // // import { useSelector } from 'react-redux';
// // // // // import { Chart, registerables } from 'chart.js';
// // // // // import './RealTimeChart.style.css';
// // // // // import { WEIGHT_UNITS } from '../../utils/const';

// // // // // Chart.register(...registerables);

// // // // // const RealTimeChart = () => {
// // // // //   const { parameter_calibration } = useSelector((state) => state.data);
// // // // //   const data = useSelector((state) => state.arduino.data);
// // // // //   const [showAllData, setShowAllData] = useState(false);
// // // // //   const [unit, setUnit] = useState(WEIGHT_UNITS.KilogramoFuerza); // Estado para la unidad seleccionada

// // // // //   const displayedData = showAllData ? data : data.slice(-200);

// // // // //   // Función para convertir voltaje a fuerza en la unidad seleccionada
// // // // //   const convertVoltage = (voltage) => {
// // // // //     // const fN = ((voltage * parameter_calibration.m) - parameter_calibration.b) * 1000 * Math.PI * 0.08546620444;
// // // // //     const fN = ((voltage * parameter_calibration.m) - parameter_calibration.b) * 1000 * Math.PI * 0.08546620444;
// // // // //     return unit === WEIGHT_UNITS.Newton ? fN : fN / 9.81; // Conversión a kgf si es necesario
// // // // //   };

// // // // //   // Obtener los últimos valores de cada variable
// // // // //   const lastVoltage = displayedData.length ? displayedData[displayedData.length - 1].voltage : 0;
// // // // //   const lastDistance = displayedData.length ? displayedData[displayedData.length - 1].distance : 0;
// // // // //   const lastTimestamp = displayedData.length ? displayedData[displayedData.length - 1].timestamp / 1000 : 0;

// // // // //   // Calcular los valores máximos de fuerza y distancia
// // // // //   const maxVoltage = Math.max(...displayedData.map((item) => convertVoltage(item.voltage)));
// // // // //   const maxDistance = Math.max(...displayedData.map((item) => item.distance));

// // // // //   const combinedData = {
// // // // //     labels: displayedData.map((item) => item.timestamp / 1000),
// // // // //     datasets: [
// // // // //       {
// // // // //         label: `Fuerza (${unit === "N" ? "N" : "kgf"})`,
// // // // //         data: displayedData.map((item) => convertVoltage(item.voltage)),
// // // // //         fill: false,
// // // // //         borderColor: 'rgba(75,192,192,1)',
// // // // //         borderWidth: 2,
// // // // //         tension: 0.2,
// // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'red' : 'rgba(75,192,192,1)')),
// // // // //         yAxisID: 'y1', // Eje izquierdo para la fuerza
// // // // //       },
// // // // //       {
// // // // //         label: 'Distancia (cm)',
// // // // //         data: displayedData.map((item) => item.distance),
// // // // //         fill: false,
// // // // //         borderColor: 'rgba(255,99,132,1)',
// // // // //         borderWidth: 2,
// // // // //         tension: 0.2,
// // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'blue' : 'rgba(255,99,132,1)')),
// // // // //         yAxisID: 'y2', // Eje derecho para la distancia
// // // // //       },
// // // // //     ],
// // // // //   };

// // // // //   const options = {
// // // // //     plugins: {
// // // // //       legend: {
// // // // //         display: true,
// // // // //         position: 'top',
// // // // //         labels: {
// // // // //           usePointStyle: true,
// // // // //         },
// // // // //         onClick: (e, legendItem) => {
// // // // //           const index = legendItem.datasetIndex;
// // // // //           const ci = e.chart;
// // // // //           ci.getDatasetMeta(index).hidden = !ci.getDatasetMeta(index).hidden;
// // // // //           ci.update();
// // // // //         },
// // // // //       },
// // // // //     },
// // // // //     scales: {
// // // // //       x: {
// // // // //         title: {
// // // // //           display: true,
// // // // //           text: 'Tiempo (s)',
// // // // //         },
// // // // //       },
// // // // //       y1: {
// // // // //         type: 'linear',
// // // // //         position: 'left',
// // // // //         title: {
// // // // //           display: true,
// // // // //           text: `Fuerza (${unit})`,
// // // // //         },
// // // // //       },
// // // // //       y2: {
// // // // //         type: 'linear',
// // // // //         position: 'right',
// // // // //         title: {
// // // // //           display: true,
// // // // //           text: 'Distancia (cm)',
// // // // //         },
// // // // //         grid: {
// // // // //           drawOnChartArea: false, // Evita que la cuadrícula del eje derecho se superponga con la del eje izquierdo
// // // // //         },
// // // // //       },
// // // // //     },
// // // // //   };

// // // // //   return (
// // // // //     <div className='chart-component'>
// // // // //       <div className="chart-container">
// // // // //         <h2>Gráfico Combinado en Tiempo Real</h2>
        
// // // // //         <label htmlFor="unitSelect">Selecciona la unidad de fuerza: </label>
// // // // //         <select
// // // // //           id="unitSelect"
// // // // //           value={unit}
// // // // //           onChange={(e) => setUnit(e.target.value)}
// // // // //         >
// // // // //           <option value="kgf">Kilogramos-fuerza (kgf)</option>
// // // // //           <option value="N">Newtons (N)</option>
// // // // //         </select>

// // // // //         <button onClick={() => setShowAllData((prev) => !prev)}>
// // // // //           {showAllData ? 'Mostrar últimos 200 datos' : 'Mostrar todos los datos'}
// // // // //         </button>

// // // // //         <Line style={{ height: '100%', width: '100%' }} data={combinedData} options={options} />
// // // // //       </div>

// // // // //       <div className="value-display">
// // // // //         <h3>Últimos Valores</h3>
// // // // //         <p><strong>Tiempo:</strong> {lastTimestamp.toFixed(2)} s</p>
// // // // //         <p><strong>Fuerza:</strong> {convertVoltage(lastVoltage).toFixed(2)} {unit}</p>
// // // // //         <p><strong>Distancia:</strong> {lastDistance.toFixed(2)} cm</p>

// // // // //         <h3>Valores Máximos</h3>
// // // // //         <p><strong>Máxima Fuerza:</strong> {maxVoltage.toFixed(2)} {unit}</p>
// // // // //         <p><strong>Máxima Distancia:</strong> {maxDistance.toFixed(2)} cm</p>
// // // // //       </div>
// // // // //     </div>
// // // // //   );
// // // // // };

// // // // // export default RealTimeChart;


// // // // // // // components/RealTimeChart.js
// // // // // // import React, { useState } from 'react';
// // // // // // import { Line } from 'react-chartjs-2';
// // // // // // import { useSelector } from 'react-redux';
// // // // // // import { Chart, registerables } from 'chart.js';
// // // // // // import './RealTimeChart.style.css';
// // // // // // import { WEIGHT_UNITS } from '../../utils/const';

// // // // // // Chart.register(...registerables);

// // // // // // const RealTimeChart = () => {
// // // // // //   const { parameter_calibration } = useSelector((state) => state.data);
// // // // // //   const data = useSelector((state) => state.arduino.data);
// // // // // //   const [showAllData, setShowAllData] = useState(false);
// // // // // //   const [unit, setUnit] = useState(WEIGHT_UNITS.KilogramoFuerza); // Estado para la unidad seleccionada

// // // // // //   // Alternar entre todos los datos o los últimos 200 datos
// // // // // //   const displayedData = showAllData ? data : data.slice(-200);
// // // // // //   console.log(parameter_calibration);
  

// // // // // //   // Función para convertir voltaje a fuerza en la unidad seleccionada
// // // // // //   const convertVoltage = (voltage) => {
// // // // // //     //const forceInNewtons = (voltage * parameter_calibration.m) - parameter_calibration.b; // Conversión a Newtons
// // // // // //     //return unit === WEIGHT_UNITS.Newton ? forceInNewtons : (parameter_calibration.m * voltage) - parameter_calibration; // Conversión a kgf si es necesario
// // // // // //     const fN = ((voltage * parameter_calibration.m) - parameter_calibration.b)*1000*Math.PI * 0.08546620444
// // // // // //     return unit === WEIGHT_UNITS.Newton 
// // // // // //     ? fN
// // // // // //     : fN/9.81; // Conversión a kgf si es necesario
// // // // // // };

// // // // // //   // Obtener los últimos valores de cada variable
// // // // // //   const lastVoltage = displayedData.length ? displayedData[displayedData.length - 1].voltage : 0;
// // // // // //   const lastDistance = displayedData.length ? displayedData[displayedData.length - 1].distance : 0;
// // // // // //   const lastTimestamp = displayedData.length ? displayedData[displayedData.length - 1].timestamp / 1000 : 0;

// // // // // //   // Calcular los valores máximos de fuerza y distancia
// // // // // //   const maxVoltage = Math.max(...displayedData.map((item) => convertVoltage(item.voltage)));
// // // // // //   const maxDistance = Math.max(...displayedData.map((item) => item.distance));

// // // // // //   const combinedData = {
// // // // // //     labels: displayedData.map((item) => item.timestamp / 1000),
// // // // // //     datasets: [
// // // // // //       {
// // // // // //         label: `Fuerza (${unit === "N" ? "N" : "kgf"})`,
// // // // // //         data: displayedData.map((item) => convertVoltage(item.voltage)),
// // // // // //         fill: false,
// // // // // //         borderColor: 'rgba(75,192,192,1)',
// // // // // //         borderWidth: 2,
// // // // // //         tension: 0.2,
// // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'red' : 'rgba(75,192,192,1)')),
// // // // // //       },
// // // // // //       {
// // // // // //         label: 'Distancia (cm)',
// // // // // //         data: displayedData.map((item) => item.distance),
// // // // // //         fill: false,
// // // // // //         borderColor: 'rgba(255,99,132,1)',
// // // // // //         borderWidth: 2,
// // // // // //         tension: 0.2,
// // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'blue' : 'rgba(255,99,132,1)')),
// // // // // //       },
// // // // // //     ],
// // // // // //   };

// // // // // //   // Opciones del gráfico con leyendas interactivas
// // // // // //   const options = {
// // // // // //     plugins: {
// // // // // //       legend: {
// // // // // //         display: true,
// // // // // //         position: 'top',
// // // // // //         labels: {
// // // // // //           usePointStyle: true,
// // // // // //         },
// // // // // //         onClick: (e, legendItem) => {
// // // // // //           const index = legendItem.datasetIndex;
// // // // // //           const ci = e.chart;
// // // // // //           ci.getDatasetMeta(index).hidden = !ci.getDatasetMeta(index).hidden;
// // // // // //           ci.update();
// // // // // //         },
// // // // // //       },
// // // // // //     },
// // // // // //     scales: {
// // // // // //       x: {
// // // // // //         title: {
// // // // // //           display: true,
// // // // // //           text: 'Tiempo (s)',
// // // // // //         },
// // // // // //       },
// // // // // //       y: {
// // // // // //         title: {
// // // // // //           display: true,
// // // // // //           text: `Fuerza (${unit}) y Distancia (cm)`,
// // // // // //         },
// // // // // //       },
// // // // // //     },
// // // // // //   };

// // // // // //   return (
// // // // // //     <div className='chart-component'>
// // // // // //       <div className="chart-container">
// // // // // //         <h2>Gráfico Combinado en Tiempo Real</h2>
        
// // // // // //         {/* Select para elegir unidades */}
// // // // // //         <label htmlFor="unitSelect">Selecciona la unidad de fuerza: </label>
// // // // // //         <select
// // // // // //           id="unitSelect"
// // // // // //           value={unit}
// // // // // //           onChange={(e) => setUnit(e.target.value)}
// // // // // //         >
// // // // // //           <option value="N">Newtons (N)</option>
// // // // // //           <option value="kgf">Kilogramos-fuerza (kgf)</option>
// // // // // //         </select>

// // // // // //         <button onClick={() => setShowAllData((prev) => !prev)}>
// // // // // //           {showAllData ? 'Mostrar últimos 200 datos' : 'Mostrar todos los datos'}
// // // // // //         </button>

// // // // // //         <Line style={{ height: '100%', width: '100%' }} data={combinedData} options={options} />
// // // // // //       </div>

// // // // // //       <div className="value-display">
// // // // // //         <h3>Últimos Valores</h3>
// // // // // //         <p><strong>Tiempo:</strong> {lastTimestamp.toFixed(2)} s</p>
// // // // // //         <p><strong>Fuerza:</strong> {convertVoltage(lastVoltage).toFixed(2)} {unit}</p>
// // // // // //         <p><strong>Distancia:</strong> {lastDistance.toFixed(2)} cm</p>

// // // // // //         <h3>Valores Máximos</h3>
// // // // // //         <p><strong>Máxima Fuerza:</strong> {maxVoltage.toFixed(2)} {unit}</p>
// // // // // //         <p><strong>Máxima Distancia:</strong> {maxDistance.toFixed(2)} cm</p>
// // // // // //       </div>
// // // // // //     </div>
// // // // // //   );
// // // // // // };

// // // // // // export default RealTimeChart;



// // // // // // // // components/RealTimeChart.js
// // // // // // // import React, { useState } from 'react';
// // // // // // // import { Line } from 'react-chartjs-2';
// // // // // // // import { useSelector } from 'react-redux';
// // // // // // // import { Chart, registerables } from 'chart.js';
// // // // // // // import './RealTimeChart.style.css';

// // // // // // // Chart.register(...registerables);

// // // // // // // const RealTimeChart = () => {
// // // // // // // const { parameter_calibration } = useSelector((state) => state.data);
// // // // // // //   const data = useSelector((state) => state.arduino.data);
// // // // // // //   const [showAllData, setShowAllData] = useState(false); // Estado para alternar entre todos los datos y los últimos 200

// // // // // // //   // Alternar entre todos los datos o los últimos 200 datos
// // // // // // //   const displayedData = showAllData ? data : data.slice(-200);

// // // // // // //   // Obtener los últimos valores de cada variable
// // // // // // //   const lastVoltage = displayedData.length ? displayedData[displayedData.length - 1].voltage : 0;
// // // // // // //   const lastDistance = displayedData.length ? displayedData[displayedData.length - 1].distance : 0;
// // // // // // //   const lastTimestamp = displayedData.length ? displayedData[displayedData.length - 1].timestamp / 1000 : 0;

// // // // // // //   // Calcular los valores máximos de voltaje y distancia
// // // // // // //   const maxVoltage = Math.max(...displayedData.map((item) => item.voltage));
// // // // // // //   const maxDistance = Math.max(...displayedData.map((item) => item.distance));

// // // // // // //   const combinedData = {
// // // // // // //     labels: displayedData.map((item) => item.timestamp / 1000),
// // // // // // //     datasets: [
// // // // // // //       {
// // // // // // //         label: 'Voltaje (V)',
// // // // // // //         data: displayedData.map((item) => item.voltage),
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(75,192,192,1)',
// // // // // // //         borderWidth: 2,
// // // // // // //         tension: 0.2,
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'red' : 'rgba(75,192,192,1)')),
// // // // // // //       },
// // // // // // //       {
// // // // // // //         label: 'Distancia (cm)',
// // // // // // //         data: displayedData.map((item) => item.distance),
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(255,99,132,1)',
// // // // // // //         borderWidth: 2,
// // // // // // //         tension: 0.2,
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'blue' : 'rgba(255,99,132,1)')),
// // // // // // //       },
// // // // // // //       {
// // // // // // //         label: 'Voltaje vs Distancia',
// // // // // // //         data: displayedData.map((item) => item.voltage), // Asegúrate de sincronizar con la distancia
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(153,102,255,1)',
// // // // // // //         borderWidth: 2,
// // // // // // //         tension: 0.2,
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'purple' : 'rgba(153,102,255,1)')),
// // // // // // //         yAxisID: 'y2',
// // // // // // //       },
// // // // // // //     ],
// // // // // // //   };

// // // // // // //   // Opciones del gráfico con leyendas interactivas
// // // // // // //   const options = {
// // // // // // //     plugins: {
// // // // // // //       legend: {
// // // // // // //         display: true,
// // // // // // //         position: 'top',
// // // // // // //         labels: {
// // // // // // //           usePointStyle: true,
// // // // // // //         },
// // // // // // //         onClick: (e, legendItem) => {
// // // // // // //           const index = legendItem.datasetIndex;
// // // // // // //           const ci = e.chart;
// // // // // // //           ci.getDatasetMeta(index).hidden = !ci.getDatasetMeta(index).hidden;
// // // // // // //           ci.update();
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //     scales: {
// // // // // // //       x: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Tiempo (s)',
// // // // // // //         },
// // // // // // //       },
// // // // // // //       y: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Voltaje (V) y Distancia (cm)',
// // // // // // //         },
// // // // // // //       },
// // // // // // //       y2: {
// // // // // // //         position: 'right',
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Voltaje vs Distancia',
// // // // // // //         },
// // // // // // //         grid: {
// // // // // // //           drawOnChartArea: false,
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div className='chart-component'>
// // // // // // //         <div className="chart-container">
// // // // // // //       <h2>Gráfico Combinado en Tiempo Real</h2>
// // // // // // //       <button onClick={() => setShowAllData((prev) => !prev)}>
// // // // // // //         {showAllData ? 'Mostrar últimos 200 datos' : 'Mostrar todos los datos'}
// // // // // // //       </button>

// // // // // // //         <Line style={{ height: '100%', width: '100%' }} data={combinedData} options={options} />
      
// // // // // // //     </div>
// // // // // // //         <div className="value-display">
// // // // // // //         <h3>Últimos Valores</h3>
// // // // // // //         <p><strong>Tiempo:</strong> {lastTimestamp.toFixed(2)} s</p>
// // // // // // //         <p><strong>Voltaje:</strong> {lastVoltage.toFixed(2)} V</p>
// // // // // // //         <p><strong>Distancia:</strong> {lastDistance.toFixed(2)} cm</p>
        
// // // // // // //         <h3>Valores Máximos</h3>
// // // // // // //         <p><strong>Máximo Voltaje:</strong> {maxVoltage.toFixed(2)} V</p>
// // // // // // //         <p><strong>Máxima Distancia:</strong> {maxDistance.toFixed(2)} cm</p>
// // // // // // //     </div>
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default RealTimeChart;


// // // // // // // // components/RealTimeChart.js
// // // // // // // import React, { useState } from 'react';
// // // // // // // import { Line } from 'react-chartjs-2';
// // // // // // // import { useSelector } from 'react-redux';
// // // // // // // import { Chart, registerables } from 'chart.js';
// // // // // // // import './RealTimeChart.style.css';

// // // // // // // Chart.register(...registerables);

// // // // // // // const RealTimeChart = () => {
// // // // // // //   const data = useSelector((state) => state.arduino.data);
// // // // // // //   const [showAllData, setShowAllData] = useState(false); // Estado para alternar entre todos los datos y los últimos 200

// // // // // // //   // Alternar entre todos los datos o los últimos 200 datos
// // // // // // //   const displayedData = showAllData ? data : data.slice(-200);

// // // // // // //   // Obtener los últimos valores de cada dataset
// // // // // // //   const lastVoltage = displayedData.length ? displayedData[displayedData.length - 1].voltage : 0;
// // // // // // //   const lastDistance = displayedData.length ? displayedData[displayedData.length - 1].distance : 0;
// // // // // // //   const lastTimestamp = displayedData.length ? displayedData[displayedData.length - 1].timestamp / 1000 : 0;

// // // // // // // // Calcular los valores máximos de voltaje y distancia
// // // // // // //   const maxVoltage = Math.max(...displayedData.map((item) => item.voltage));
// // // // // // //   const maxDistance = Math.max(...displayedData.map((item) => item.distance));

// // // // // // //   const combinedData = {
// // // // // // //     labels: displayedData.map((item) => item.timestamp / 1000),
// // // // // // //     datasets: [
// // // // // // //       {
// // // // // // //         label: 'Voltaje (V)',
// // // // // // //         data: displayedData.map((item) => item.voltage),
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(75,192,192,1)',
// // // // // // //         borderWidth: 2,
// // // // // // //         tension: 0.2,
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'red' : 'rgba(75,192,192,1)')),
// // // // // // //       },
// // // // // // //       {
// // // // // // //         label: 'Distancia (cm)',
// // // // // // //         data: displayedData.map((item) => item.distance),
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(255,99,132,1)',
// // // // // // //         borderWidth: 2,
// // // // // // //         tension: 0.2,
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'blue' : 'rgba(255,99,132,1)')),
// // // // // // //       },
// // // // // // //       {
// // // // // // //         label: 'Voltaje vs Distancia',
// // // // // // //         data: displayedData.map((item) => item.voltage), // Asegúrate de sincronizar con la distancia
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(153,102,255,1)',
// // // // // // //         borderWidth: 2,
// // // // // // //         tension: 0.2,
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'purple' : 'rgba(153,102,255,1)')),
// // // // // // //         yAxisID: 'y2',
// // // // // // //       },
// // // // // // //     ],
// // // // // // //   };

// // // // // // //   // Opciones del gráfico con leyendas interactivas
// // // // // // //   const options = {
// // // // // // //     plugins: {
// // // // // // //       legend: {
// // // // // // //         display: true,
// // // // // // //         position: 'top',
// // // // // // //         labels: {
// // // // // // //           usePointStyle: true,
// // // // // // //         },
// // // // // // //         onClick: (e, legendItem) => {
// // // // // // //           const index = legendItem.datasetIndex;
// // // // // // //           const ci = e.chart;
// // // // // // //           ci.getDatasetMeta(index).hidden = !ci.getDatasetMeta(index).hidden;
// // // // // // //           ci.update();
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //     scales: {
// // // // // // //       x: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Tiempo (s)',
// // // // // // //         },
// // // // // // //       },
// // // // // // //       y: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Voltaje (V) y Distancia (cm)',
// // // // // // //         },
// // // // // // //       },
// // // // // // //       y2: {
// // // // // // //         position: 'right',
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Voltaje vs Distancia',
// // // // // // //         },
// // // // // // //         grid: {
// // // // // // //           drawOnChartArea: false,
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div className="chart-container">
// // // // // // //       <h2>Gráfico Combinado en Tiempo Real</h2>
// // // // // // //       <button onClick={() => setShowAllData((prev) => !prev)}>
// // // // // // //         {showAllData ? 'Mostrar últimos 200 datos' : 'Mostrar todos los datos'}
// // // // // // //       </button>
// // // // // // //       <Line data={combinedData} options={options} />
      
// // // // // // //       {/* Sección para mostrar los últimos valores */}
// // // // // // //       <h3>Últimos Valores</h3>
// // // // // // //       <div className="value-display">
// // // // // // //         <div className="last-values">
// // // // // // //             <p><strong>Tiempo:</strong> {lastTimestamp.toFixed(2)} s</p>
// // // // // // //             <p><strong>Voltaje:</strong> {lastVoltage.toFixed(2)} V</p>
// // // // // // //             <p><strong>Distancia:</strong> {lastDistance.toFixed(2)} cm</p>
// // // // // // //         </div>
// // // // // // //         <h3>Valores Máximos</h3>
// // // // // // //         <div className='maximum-values'>
// // // // // // //         <p><strong>Máximo Voltaje:</strong> {maxVoltage.toFixed(2)} V</p>
// // // // // // //         <p><strong>Máxima Distancia:</strong> {maxDistance.toFixed(2)} cm</p>
// // // // // // //         </div>
// // // // // // //       </div>
      
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default RealTimeChart;



// // // // // // // // components/RealTimeChart.js
// // // // // // // import React, { useState } from 'react';
// // // // // // // import { Line } from 'react-chartjs-2';
// // // // // // // import { useSelector } from 'react-redux';
// // // // // // // import { Chart, registerables } from 'chart.js';
// // // // // // // import './RealTimeChart.style.css';

// // // // // // // Chart.register(...registerables);

// // // // // // // const RealTimeChart = () => {
// // // // // // //   const data = useSelector((state) => state.arduino.data);
// // // // // // //   const [showAllData, setShowAllData] = useState(false); // Estado para alternar entre todos los datos y los últimos 200

// // // // // // //   // Alternar entre todos los datos o los últimos 200 datos
// // // // // // //   const displayedData = showAllData ? data : data.slice(-200);

// // // // // // //   const combinedData = {
// // // // // // //     labels: displayedData.map((item) => item.timestamp/1000),
// // // // // // //     datasets: [
// // // // // // //       {
// // // // // // //         label: 'Voltaje (V)',
// // // // // // //         data: displayedData.map((item) => item.voltage),
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(75,192,192,1)',
// // // // // // //         borderWidth: 2,
// // // // // // //         tension: 0.2,
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'red' : 'rgba(75,192,192,1)')),
// // // // // // //       },
// // // // // // //       {
// // // // // // //         label: 'Distancia (cm)',
// // // // // // //         data: displayedData.map((item) => item.distance),
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(255,99,132,1)',
// // // // // // //         borderWidth: 2,
// // // // // // //         tension: 0.2,
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'blue' : 'rgba(255,99,132,1)')),
// // // // // // //       },
// // // // // // //       {
// // // // // // //         label: 'Voltaje vs Distancia',
// // // // // // //         data: displayedData.map((item) => item.voltage), // Asegúrate de sincronizar con la distancia
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(153,102,255,1)',
// // // // // // //         borderWidth: 2,
// // // // // // //         tension: 0.2,
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'purple' : 'rgba(153,102,255,1)')),
// // // // // // //         yAxisID: 'y2',
// // // // // // //       },
// // // // // // //     ],
// // // // // // //   };

// // // // // // //   // Opciones del gráfico con leyendas interactivas
// // // // // // //   const options = {
// // // // // // //     plugins: {
// // // // // // //       legend: {
// // // // // // //         display: true,
// // // // // // //         position: 'top',
// // // // // // //         labels: {
// // // // // // //           usePointStyle: true,
// // // // // // //         },
// // // // // // //         onClick: (e, legendItem) => {
// // // // // // //           const index = legendItem.datasetIndex;
// // // // // // //           const ci = e.chart;
// // // // // // //           ci.getDatasetMeta(index).hidden = !ci.getDatasetMeta(index).hidden;
// // // // // // //           ci.update();
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //     scales: {
// // // // // // //       x: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Tiempo (s)',
// // // // // // //         },
// // // // // // //       },
// // // // // // //       y: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Voltaje (V) y Distancia (cm)',
// // // // // // //         },
// // // // // // //       },
// // // // // // //       y2: {
// // // // // // //         position: 'right',
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Voltaje vs Distancia',
// // // // // // //         },
// // // // // // //         grid: {
// // // // // // //           drawOnChartArea: false,
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div className="chart-container">
// // // // // // //       <h2>Gráfico Combinado en Tiempo Real</h2>
// // // // // // //       <button onClick={() => setShowAllData((prev) => !prev)}>
// // // // // // //         {showAllData ? 'Mostrar últimos 200 datos' : 'Mostrar todos los datos'}
// // // // // // //       </button>
// // // // // // //       <Line data={combinedData} options={options} />
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default RealTimeChart;


// // // // // // // // components/RealTimeChart.js
// // // // // // // import React from 'react';
// // // // // // // import { Line } from 'react-chartjs-2';
// // // // // // // import { useSelector } from 'react-redux';
// // // // // // // import { Chart, registerables } from 'chart.js';
// // // // // // // import './RealTimeChart.style.css';

// // // // // // // Chart.register(...registerables);

// // // // // // // const RealTimeChart = () => {
// // // // // // //   const data = useSelector((state) => state.arduino.data);

// // // // // // //   // Configuración de los datos para todos los gráficos en un solo gráfico
// // // // // // //   const displayedData = data.slice(-200);

// // // // // // //   const combinedData = {
// // // // // // //     labels: displayedData.map((item) => item.timestamp),
// // // // // // //     datasets: [
// // // // // // //       {
// // // // // // //         label: 'Voltaje (V)',
// // // // // // //         data: displayedData.map((item) => item.voltage),
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(75,192,192,1)',
// // // // // // //         borderWidth: 2,
// // // // // // //         tension: 0.2,
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'red' : 'rgba(75,192,192,1)')),
// // // // // // //       },
// // // // // // //       {
// // // // // // //         label: 'Distancia (cm)',
// // // // // // //         data: displayedData.map((item) => item.distance),
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(255,99,132,1)',
// // // // // // //         borderWidth: 2,
// // // // // // //         tension: 0.2,
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'blue' : 'rgba(255,99,132,1)')),
// // // // // // //       },
// // // // // // //       {
// // // // // // //         label: 'Voltaje vs Distancia',
// // // // // // //         data: displayedData.map((item) => item.voltage), // Asegúrate de sincronizar con la distancia
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(153,102,255,1)',
// // // // // // //         borderWidth: 2,
// // // // // // //         tension: 0.2,
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)),
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'purple' : 'rgba(153,102,255,1)')),
// // // // // // //         yAxisID: 'y2',
// // // // // // //       },
// // // // // // //     ],
// // // // // // //   };

// // // // // // //   // Opciones del gráfico con leyendas interactivas
// // // // // // //   const options = {
// // // // // // //     plugins: {
// // // // // // //       legend: {
// // // // // // //         display: true,
// // // // // // //         position: 'top',
// // // // // // //         labels: {
// // // // // // //           usePointStyle: true,
// // // // // // //         },
// // // // // // //         onClick: (e, legendItem) => {
// // // // // // //           const index = legendItem.datasetIndex;
// // // // // // //           const ci = e.chart;
// // // // // // //           ci.getDatasetMeta(index).hidden = !ci.getDatasetMeta(index).hidden;
// // // // // // //           ci.update();
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //     scales: {
// // // // // // //       x: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Tiempo (ms)',
// // // // // // //         },
// // // // // // //       },
// // // // // // //       y: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Voltaje (V) y Distancia (cm)',
// // // // // // //         },
// // // // // // //       },
// // // // // // //       y2: {
// // // // // // //         position: 'right',
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Voltaje vs Distancia',
// // // // // // //         },
// // // // // // //         grid: {
// // // // // // //           drawOnChartArea: false,
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div className="chart-container">
// // // // // // //       <h2>Gráfico Combinado en Tiempo Real</h2>
// // // // // // //       <Line data={combinedData} options={options} />
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default RealTimeChart;


// // // // // // // // components/RealTimeVoltageChart.js
// // // // // // // import React, { useState } from 'react';
// // // // // // // import { Line } from 'react-chartjs-2';
// // // // // // // import { useSelector } from 'react-redux';
// // // // // // // import { Chart, registerables } from 'chart.js';

// // // // // // // Chart.register(...registerables);

// // // // // // // const RealTimeChart = () => {
// // // // // // //   const data = useSelector((state) => state.arduino.data);
// // // // // // //   const [showAllData, setShowAllData] = useState(false);

// // // // // // //   const displayedData = showAllData ? data : data.slice(-200);

// // // // // // //   const chartData = {
// // // // // // //     labels: displayedData.map((item) => item.timestamp), 
// // // // // // //     datasets: [
// // // // // // //       {
// // // // // // //         label: 'Voltaje (V)',
// // // // // // //         data: displayedData.map((item) => item.voltage), 
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(75,192,192,1)',
// // // // // // //         borderWidth: 2, // Grosor de la línea para mayor visibilidad
// // // // // // //         tension: 0.2, // Curvatura más suave
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 0)), // Solo último punto visible
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'red' : 'rgba(75,192,192,1)')),
// // // // // // //       },
// // // // // // //     ],
// // // // // // //   };

// // // // // // //   const options = {
// // // // // // //     scales: {
// // // // // // //       x: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Tiempo (ms)',
// // // // // // //         },
// // // // // // //       },
// // // // // // //       y: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Voltaje (V)',
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //     plugins: {
// // // // // // //       tooltip: {
// // // // // // //         enabled: true,
// // // // // // //       },
// // // // // // //       annotation: {
// // // // // // //         annotations: {
// // // // // // //           lastPointLabel: {
// // // // // // //             type: 'label',
// // // // // // //             xValue: displayedData.length > 0 ? displayedData[displayedData.length - 1].timestamp : null,
// // // // // // //             yValue: displayedData.length > 0 ? displayedData[displayedData.length - 1].voltage : null,
// // // // // // //             backgroundColor: 'rgba(255, 99, 132, 0.2)',
// // // // // // //             borderColor: 'red',
// // // // // // //             borderWidth: 1,
// // // // // // //             content: displayedData.length > 0 ? `${displayedData[displayedData.length - 1].voltage.toFixed(3)} V` : '',
// // // // // // //             color: 'black',
// // // // // // //             font: {
// // // // // // //               size: 12,
// // // // // // //             },
// // // // // // //             display: true,
// // // // // // //             position: 'center',
// // // // // // //             xAdjust: 10,
// // // // // // //             yAdjust: -15,
// // // // // // //           },
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //   };

// // // // // // //   const latestVoltage = data.length > 0 ? data[data.length - 1].voltage.toFixed(3) : null;

// // // // // // //   return (
// // // // // // //     <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column"}}>
// // // // // // //       <h2>Voltaje en Tiempo Real</h2>
// // // // // // //       <button onClick={() => setShowAllData(!showAllData)} style={{ marginBottom: '10px' }}>
// // // // // // //         {showAllData ? 'Mostrar últimos 200 datos' : 'Mostrar todos los datos'}
// // // // // // //       </button>
// // // // // // //       <div style={{flex:1}}>
// // // // // // //         <Line data={chartData} options={options} />
// // // // // // //       </div>
// // // // // // //       <div style={{ marginTop: '10px' }}>
// // // // // // //         <span style={{ fontWeight: 'bold' }}>
// // // // // // //           Último voltaje registrado: {latestVoltage ? `${latestVoltage} V` : 'N/A'}
// // // // // // //         </span>
// // // // // // //       </div>
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default RealTimeChart;


// // // // // // // // components/RealTimeVoltageChart.js
// // // // // // // import React, { useState } from 'react';
// // // // // // // import { Line } from 'react-chartjs-2';
// // // // // // // import { useSelector } from 'react-redux';
// // // // // // // import { Chart, registerables } from 'chart.js';

// // // // // // // Chart.register(...registerables);

// // // // // // // const RealTimeChart = () => {
// // // // // // //   const data = useSelector((state) => state.arduino.data);
// // // // // // //   const [showAllData, setShowAllData] = useState(false); // Estado para alternar entre modos

// // // // // // //   // Definir los datos a graficar según el modo seleccionado
// // // // // // //   const displayedData = showAllData ? data : data.slice(-200);

// // // // // // //   // Mapeo de los datos para el gráfico
// // // // // // //   const chartData = {
// // // // // // //     labels: displayedData.map((item) => item.timestamp), // Usar `timestamp` para el eje X
// // // // // // //     datasets: [
// // // // // // //       {
// // // // // // //         label: 'Voltaje (V)',
// // // // // // //         data: displayedData.map((item) => item.voltage), // Extraer el voltaje
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(75,192,192,1)',
// // // // // // //         tension: 0.1,
// // // // // // //         pointRadius: displayedData.map((_, index) => (index === displayedData.length - 1 ? 6 : 3)), // Último punto más grande
// // // // // // //         pointBackgroundColor: displayedData.map((_, index) => (index === displayedData.length - 1 ? 'red' : 'rgba(75,192,192,1)')), // Último punto en rojo
// // // // // // //       },
// // // // // // //     ],
// // // // // // //   };

// // // // // // //   const options = {
// // // // // // //     scales: {
// // // // // // //       x: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Tiempo (ms)', // Etiqueta del eje X
// // // // // // //         },
// // // // // // //       },
// // // // // // //       y: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Voltaje (V)', // Etiqueta del eje Y
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //     plugins: {
// // // // // // //       tooltip: {
// // // // // // //         enabled: true,
// // // // // // //       },
// // // // // // //       annotation: {
// // // // // // //         annotations: {
// // // // // // //           lastPointLabel: {
// // // // // // //             type: 'label',
// // // // // // //             xValue: displayedData.length > 0 ? displayedData[displayedData.length - 1].timestamp : null, // Posición del último timestamp en X
// // // // // // //             yValue: displayedData.length > 0 ? displayedData[displayedData.length - 1].voltage : null, // Posición del último voltaje en Y
// // // // // // //             backgroundColor: 'rgba(255, 99, 132, 0.2)',
// // // // // // //             borderColor: 'red',
// // // // // // //             borderWidth: 1,
// // // // // // //             content: displayedData.length > 0 ? `${displayedData[displayedData.length - 1].voltage.toFixed(3)} V` : '',
// // // // // // //             color: 'black',
// // // // // // //             font: {
// // // // // // //               size: 12,
// // // // // // //             },
// // // // // // //             display: true,
// // // // // // //             position: 'center',
// // // // // // //             xAdjust: 10,
// // // // // // //             yAdjust: -15, // Ajuste en Y para ubicar el valor por encima del punto
// // // // // // //           },
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //   };

// // // // // // //   // Valor del último punto
// // // // // // //   const latestVoltage = data.length > 0 ? data[data.length - 1].voltage.toFixed(3) : null;

// // // // // // //   return (
// // // // // // //     <div>
// // // // // // //       <h2>Voltaje en Tiempo Real</h2>
// // // // // // //       <button onClick={() => setShowAllData(!showAllData)} style={{ marginBottom: '10px' }}>
// // // // // // //         {showAllData ? 'Mostrar últimos 200 datos' : 'Mostrar todos los datos'}
// // // // // // //       </button>
// // // // // // //       <Line data={chartData} options={options} />
// // // // // // //       <div style={{ marginTop: '10px' }}>
// // // // // // //         <span style={{ fontWeight: 'bold' }}>
// // // // // // //           Último voltaje registrado: {latestVoltage ? `${latestVoltage} V` : 'N/A'}
// // // // // // //         </span>
// // // // // // //       </div>
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default RealTimeChart;


// // // // // // // // components/RealTimeVoltageChart.js
// // // // // // // import React from 'react';
// // // // // // // import { Line } from 'react-chartjs-2';
// // // // // // // import { useSelector } from 'react-redux';
// // // // // // // import { Chart, registerables } from 'chart.js';

// // // // // // // Chart.register(...registerables);

// // // // // // // const RealTimeChart = () => {
// // // // // // //   const data = useSelector((state) => state.arduino.data);

// // // // // // //   // Mapeo de los datos para el gráfico
// // // // // // //   const chartData = {
// // // // // // //     labels: data.map((item) => item.timestamp), // Usar `timestamp` para el eje X
// // // // // // //     datasets: [
// // // // // // //       {
// // // // // // //         label: 'Voltaje (V)',
// // // // // // //         data: data.map((item) => item.voltage), // Extraer el voltaje
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(75,192,192,1)',
// // // // // // //         tension: 0.1,
// // // // // // //         pointRadius: data.map((_, index) => (index === data.length - 1 ? 6 : 3)), // Último punto más grande
// // // // // // //         pointBackgroundColor: data.map((_, index) => (index === data.length - 1 ? 'red' : 'rgba(75,192,192,1)')), // Último punto en rojo
// // // // // // //       },
// // // // // // //     ],
// // // // // // //   };

// // // // // // //   const options = {
// // // // // // //     scales: {
// // // // // // //       x: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Tiempo (ms)', // Etiqueta del eje X
// // // // // // //         },
// // // // // // //       },
// // // // // // //       y: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Voltaje (V)', // Etiqueta del eje Y
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //     plugins: {
// // // // // // //       tooltip: {
// // // // // // //         enabled: true,
// // // // // // //       },
// // // // // // //       annotation: {
// // // // // // //         annotations: {
// // // // // // //           lastPointLabel: {
// // // // // // //             type: 'label',
// // // // // // //             xValue: data.length > 0 ? data[data.length - 1].timestamp : null, // Posición del último timestamp en X
// // // // // // //             yValue: data.length > 0 ? data[data.length - 1].voltage : null, // Posición del último voltaje en Y
// // // // // // //             backgroundColor: 'rgba(255, 99, 132, 0.2)',
// // // // // // //             borderColor: 'red',
// // // // // // //             borderWidth: 1,
// // // // // // //             content: data.length > 0 ? `${data[data.length - 1].voltage.toFixed(3)} V` : '',
// // // // // // //             color: 'black',
// // // // // // //             font: {
// // // // // // //               size: 12,
// // // // // // //             },
// // // // // // //             display: true,
// // // // // // //             position: 'center',
// // // // // // //             xAdjust: 10,
// // // // // // //             yAdjust: -15, // Ajuste en Y para ubicar el valor por encima del punto
// // // // // // //           },
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //   };

// // // // // // //   // Valor del último punto
// // // // // // //   const latestVoltage = data.length > 0 ? data[data.length - 1].voltage.toFixed(3) : null;

// // // // // // //   return (
// // // // // // //     <div>
// // // // // // //       <h2>Voltaje en Tiempo Real</h2>
// // // // // // //       <Line data={chartData} options={options} />
// // // // // // //       <div style={{ marginTop: '10px' }}>
// // // // // // //         <span style={{ fontWeight: 'bold' }}>
// // // // // // //           Último voltaje registrado: {latestVoltage ? `${latestVoltage} V` : 'N/A'}
// // // // // // //         </span>
// // // // // // //       </div>
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default RealTimeChart;


// // // // // // // // components/RealTimeVoltageChart.js
// // // // // // // import React from 'react';
// // // // // // // import { Line } from 'react-chartjs-2';
// // // // // // // import { useSelector } from 'react-redux';
// // // // // // // import { Chart, registerables } from 'chart.js';

// // // // // // // // Registrar todos los componentes necesarios
// // // // // // // Chart.register(...registerables);

// // // // // // // const RealTimeChart = () => {
// // // // // // //   const data = useSelector((state) => state.arduino.data);

// // // // // // //   // Mapeo de los datos para el gráfico
// // // // // // //   const chartData = {
// // // // // // //     labels: data.map((item) => item.timestamp), // Usar `timestamp` para el eje X
// // // // // // //     datasets: [
// // // // // // //       {
// // // // // // //         label: 'Voltaje (V)',
// // // // // // //         data: data.map((item) => item.voltage), // Extraer el voltaje
// // // // // // //         fill: false,
// // // // // // //         borderColor: 'rgba(75,192,192,1)',
// // // // // // //         tension: 0.1,
// // // // // // //         pointRadius: data.map((_, index) => (index === data.length - 1 ? 6 : 3)), // Último punto más grande
// // // // // // //         pointBackgroundColor: data.map((_, index) => (index === data.length - 1 ? 'red' : 'rgba(75,192,192,1)')), // Último punto en rojo
// // // // // // //       },
// // // // // // //     ],
// // // // // // //   };

// // // // // // //   const options = {
// // // // // // //     scales: {
// // // // // // //       x: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Tiempo (ms)', // Etiqueta del eje X
// // // // // // //         },
// // // // // // //       },
// // // // // // //       y: {
// // // // // // //         title: {
// // // // // // //           display: true,
// // // // // // //           text: 'Voltaje (V)', // Etiqueta del eje Y
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //     plugins: {
// // // // // // //       tooltip: {
// // // // // // //         enabled: true,
// // // // // // //         callbacks: {
// // // // // // //           label: function (context) {
// // // // // // //             // Mostrar valor de voltaje en el último punto
// // // // // // //             if (context.dataIndex === data.length - 1) {
// // // // // // //               return `Último Voltaje: ${context.raw.toFixed(3)} V`;
// // // // // // //             }
// // // // // // //             return `Voltaje: ${context.raw.toFixed(3)} V`;
// // // // // // //           },
// // // // // // //         },
// // // // // // //       },
// // // // // // //     },
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div>
// // // // // // //       <h2>Voltaje en Tiempo Real</h2>
// // // // // // //       <Line data={chartData} options={options} />
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // };

// // // // // // // export default RealTimeChart;
