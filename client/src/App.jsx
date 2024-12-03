import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { io } from 'socket.io-client';
import HomePage from './pages/HomePage';
import { Routes, Route, Outlet, Link } from "react-router-dom";
import CalibrationPage from './pages/CalibrationPage';
import CalibrationAssistedPage from './pages/CalibrationAssistedPage';
import CalibrationUnassistedPage from './pages/CalibrationUnassistedPage';
import { CalibrationLayout } from './layouts/CalibrationLayout';
import { useDispatch } from 'react-redux';
import { startArduinoConnection, clearSocketListeners } from './services/arduinoService';
import { useSelector } from 'react-redux';
import { TestPage } from './pages/TestPage';
import useFetch from './customHooks/useFetch';

function App() {
  const [count, setCount] = useState(0)
  const [arduinoData, setArduinoData] = useState(null); // Estado para almacenar los datos del Arduino
  // const dispatch = useDispatch();
  // const { connected, port, data } = useSelector((state) => state.arduino);
  // Define la URL usando el nombre de la variable
  

  // useEffect(() => {
  //   // Llama al servicio para iniciar la conexión al Arduino
  //   startArduinoConnection(socket, dispatch);

  //   // Limpia los listeners del socket al desmontar el componente
  //   return () => {
  //     clearSocketListeners();
  //   };
  // }, [dispatch]);
  // Llamar a fetchData cuando se monta el componente para cargar los datos de calibración
  // useEffect(() => {
  //   fetchData();
  // }, []);

  return (
    <>
      <Routes>
        {/* <Route path="/" element={<Layout />}> */}
          <Route path="/" element={<HomePage/>}/>
          <Route path="calibration" element={<CalibrationLayout/>}>
              <Route index element={<CalibrationPage/>} />
              <Route path="assisted" element={<CalibrationAssistedPage/>} />
              <Route path="unassisted" element={<CalibrationUnassistedPage/>} />
          </Route>
          <Route path="/test" element={<TestPage/>}/>

          {/* Using path="*"" means "match anything", so this route
                acts like a catch-all for URLs that we don't have explicit
                routes for. */}
          {/* <Route path="*" element={<NoMatch />} /> */}
        {/* </Route> */}
      </Routes>
    </>
  )
}

export default App
