// store/store.js
import { configureStore } from '@reduxjs/toolkit';
import arduinoReducer from './arduinoSlice';
import dataReducer from './dataSlice';

const store = configureStore({
  reducer: {
    arduino: arduinoReducer,
    data: dataReducer,
  },
});

export default store;
