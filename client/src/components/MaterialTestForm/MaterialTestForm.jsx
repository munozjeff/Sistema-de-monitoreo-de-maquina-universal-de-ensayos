import React, { useState } from 'react';
import './MaterialTestForm.style.css';
import { useNavigate } from 'react-router-dom';

const MaterialTestForm = ({sendForm = ()=>{}}) => {
  const [testType, setTestType] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [shape, setShape] = useState('');
  const [rectangularDimensions, setRectangularDimensions] = useState({ width: '', length: '', height: '' });
  const [cylinderDimensions, setCylinderDimensions] = useState({ diameter: '', height: '' });
  const [otherShape, setOtherShape] = useState('');
  const [initialLength, setInitialLength] = useState('');
  const navigate = useNavigate();

  const handleShapeChange = (event) => {
    setShape(event.target.value);
    setRectangularDimensions({ width: '', length: '', height: '' });
    setCylinderDimensions({ diameter: '', height: '' });
    setOtherShape('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes agregar lógica adicional para manejar la acción al presionar "Continuar"
    let data = null;
    if (testType === '' || materialType === '' || shape === '' || initialLength === '') {
      alert("Por favor llene todos los campos");
    }
    else {
      if(shape === 'rectangular'){
        if(rectangularDimensions.width === '' || rectangularDimensions.length === '' || rectangularDimensions.height === ''){
          alert("Por favor llene todos los campos");
        }
        else{
          data = {
            testType: testType,
            materialType: materialType,
            shape: shape,
            dimensions: rectangularDimensions,
            initialLength: initialLength
          }
        }
  
      }else if(shape === 'cylindrical'){
        if(cylinderDimensions.diameter === '' || cylinderDimensions.height === ''){
          alert("Por favor llene todos los campos");
        }
        else{
          data = {
            testType: testType,
            materialType: materialType,
            shape: shape,
            dimensions: cylinderDimensions,
            initialLength: initialLength
          }
        }
  
      }else if(shape === 'other'){
        if(otherShape === ''){
          alert("Por favor llene todos los campos");
        }
        else{
          data = {
            testType: testType,
            materialType: materialType,
            shape: shape,
            dimensions: otherShape,
            initialLength: initialLength
          }
        }
      }
    }
    if(data){
      sendForm(data);
    }
  };

  return (
    <div id="material-test-form">
      <h2>Formulario de Ensayo de Material</h2>

      {/* Tipo de ensayo */}
      <label className="material-form-label">Tipo de Ensayo:</label>
      <select
        className="material-form-select"
        value={testType}
        onChange={(e) => setTestType(e.target.value)}
      >
        <option value="">Seleccione</option>
        <option value="compresion">Compresión</option>
        <option value="tension">Tensión</option>
      </select>

      {/* Tipo de material */}
      <label className="material-form-label">Tipo de Material:</label>
      <input
        type="text"
        className="material-form-input"
        value={materialType}
        onChange={(e) => setMaterialType(e.target.value)}
      />

      {/* Forma del material */}
      <label className="material-form-label">Forma del Material:</label>
      <select
        className="material-form-select"
        value={shape}
        onChange={handleShapeChange}
      >
        <option value="">Seleccione</option>
        <option value="rectangular">Rectangular</option>
        <option value="cylindrical">Cilindro</option>
        <option value="other">Otro</option>
      </select>

      {/* Dimensiones basadas en la forma */}
      {shape === 'rectangular' && (
        <div className="shape-container">
          <div>
            <label className="material-form-label">Ancho:</label>
            <input
              type="number"
              className="material-form-input"
              value={rectangularDimensions.width}
              onChange={(e) => setRectangularDimensions({ ...rectangularDimensions, width: e.target.value })}
            />
          </div>

          <div>
            <label className="material-form-label">Largo:</label>
            <input
              type="number"
              className="material-form-input"
              value={rectangularDimensions.length}
              onChange={(e) => setRectangularDimensions({ ...rectangularDimensions, length: e.target.value })}
            />
          </div>

          <div>
            <label className="material-form-label">Alto:</label>
            <input
              type="number"
              className="material-form-input"
              value={rectangularDimensions.height}
              onChange={(e) => setRectangularDimensions({ ...rectangularDimensions, height: e.target.value })}
            />
          </div>
        </div>
      )}

      {shape === 'cylindrical' && (
        <div className="shape-container">
          <div>
            <label className="material-form-label">Diámetro:</label>
            <input
              type="number"
              className="material-form-input"
              value={cylinderDimensions.diameter}
              onChange={(e) => setCylinderDimensions({ ...cylinderDimensions, diameter: e.target.value })}
            />
          </div>

          <div>
            <label className="material-form-label">Altura:</label>
            <input
              type="number"
              className="material-form-input"
              value={cylinderDimensions.height}
              onChange={(e) => setCylinderDimensions({ ...cylinderDimensions, height: e.target.value })}
            />
          </div>
        </div>
      )}

      {shape === 'other' && (
        <div>
          <label className="material-form-label">Descripción de la forma:</label>
          <input
            type="text"
            className="material-form-input"
            value={otherShape}
            onChange={(e) => setOtherShape(e.target.value)}
          />
        </div>
      )}

      {/* Longitud inicial */}
      <label className="material-form-label">Longitud Inicial:</label>
      <input
        type="number"
        className="material-form-input"
        value={initialLength}
        onChange={(e) => setInitialLength(e.target.value)}
      />

      {/* Botón de continuar */}
      <div className='control-button'>
        <button className="continue-button" onClick={()=>navigate(-1)}>
            Cancelar
        </button>
        <button className="continue-button" onClick={handleSubmit}>
          Continuar
        </button>
      </div>
    </div>
  );
};

export default MaterialTestForm;
