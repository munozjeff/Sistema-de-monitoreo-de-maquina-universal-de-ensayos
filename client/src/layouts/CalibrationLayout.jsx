import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom'
import { clearSocketListeners, startArduinoConnection } from '../services/arduinoService';
import { io } from 'socket.io-client';
import useFetch from '../customHooks/useFetch';

const socket = io('http://localhost:5000'); // Cambia la URL según sea necesario

export const CalibrationLayout = () => {
  const dispatch = useDispatch();
  const { data, error, loading, fetchData } = useFetch("http://localhost:5000/stop-arduino");
  
  useEffect(() => {
    // Llama al servicio para iniciar la conexión al Arduino
    startArduinoConnection(socket, dispatch);

    // Limpia los listeners del socket al desmontar el componente
    return () => {
      clearSocketListeners();
      fetchData();
    };
  }, [dispatch]);
  

  return (
    <Outlet/>
  )
}
