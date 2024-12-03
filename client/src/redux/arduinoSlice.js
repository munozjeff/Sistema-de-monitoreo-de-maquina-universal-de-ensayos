// store/arduinoSlice.js
import { createSlice } from '@reduxjs/toolkit';

const arduinoSlice = createSlice({
  name: 'arduino',
  initialState: {
    connected: false,
    port: null,
    data: [],
  },
  reducers: {
    setConnected(state, action) {
      state.connected = action.payload.connected;
      state.port = action.payload.port;
    },
    setDisconnected(state) {
      state.connected = false;
      state.port = null;
    },
    addData(state, action) {
      // Agregar nuevo dato
      state.data.push(action.payload);
      
      // Mantener solo los últimos 200 datos
      // if (state.data.length > 200) {
      //   state.data.shift(); // Elimina el primer elemento
      // }
    },
    clearData: (state) => {
      state.data = []; // Reinicia el estado
    },
  },
});

export const { setConnected, setDisconnected, addData, clearData } = arduinoSlice.actions;
export default arduinoSlice.reducer;
