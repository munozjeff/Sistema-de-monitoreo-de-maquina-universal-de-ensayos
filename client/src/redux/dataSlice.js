// store/arduinoSlice.js
import { createSlice } from '@reduxjs/toolkit';

const dataSlice = createSlice({
  name: 'data',
  initialState: {
    parameter_calibration: null,
  },
  reducers: {
    setParametersCalibration(state, action) {
      state.parameter_calibration = action.payload;
    }
  },
});

export const { setParametersCalibration} = dataSlice.actions;
export default dataSlice.reducer;
