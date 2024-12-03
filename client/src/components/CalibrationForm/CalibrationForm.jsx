// CalibrationForm.js
import React, { useEffect, useState } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { WEIGHT_UNITS } from '../../utils/const';

const CalibrationForm = ({title="TITLE",paragraph="Información",disabled=false,onClickBack=()=>{}, onClickNext=()=>{}}) => {
    const { data } = useSelector((state) => state.arduino);
    const [calibrationValue, setCalibrationValue] = useState(0)
    const [units,setUnits] = useState(WEIGHT_UNITS.KilogramoFuerza)

    const nextHandler = () => {
        // Captura el último valor en el array `data`
        const ultimoValor = data.length > 0 ? data[data.length - 1] : 0;
        console.log(ultimoValor);
        onClickNext({step:title, data:{bar:unitToBaresConversion(units,parseFloat(calibrationValue)),voltage:ultimoValor.voltage}});
    }

    const unitToBaresConversion = (unit,value) => {

        if(unit == WEIGHT_UNITS.KilogramoFuerza){
            const areaCilindro = Math.PI * 0.08546620444    //Area Cilindro m2
            const fN = value*9.81   //fuerza en Newton
            const pA = fN/areaCilindro  //presión en pascales
            const pB = pA/100000
            return pB
        }else if(unit == WEIGHT_UNITS.Newton){
            const areaCilindro = Math.PI * 0.08546620444    //Area Cilindro m2
            const pA = value/areaCilindro  //presión en pascales
            const pB = pA/100000
            return pB
        }
    }

    return (
        <Container style={{ marginTop: '20px', maxWidth: '500px' }}>
            <h2>{title}</h2>
            <p>{paragraph}</p>
            
            <Form>
                <Form.Group controlId="calibrationValue" className="mb-3">
                    <Form.Select disabled={!disabled} defaultValue={units} onChange={(e)=>setUnits(e.target.value)
                    }>
                        {Object.keys(WEIGHT_UNITS).map((e,index)=><option key={index}>{WEIGHT_UNITS[e]}</option>)}
                    </Form.Select>
                    <Form.Label>{`Valor en ${units}`}</Form.Label>
                    <Form.Control onChange={(e)=>{setCalibrationValue(e.target.value)}}
                        type="number" 
                        placeholder="Ingrese un valor numérico" 
                        required
                        // defaultValue={0}
                        value={calibrationValue}
                        disabled={disabled}
                    />
                    {/* <Form.Label>Valor de Voltaje</Form.Label> */}
                    {/* <Form.Control 
                        type="number" 
                        placeholder="Ingrese un valor numérico" 
                        required
                        defaultValue={0}
                        step="0.001"
                        disabled={true}
                    /> */}
                </Form.Group>

                <div className="d-flex justify-content-between mt-4">
                    <Button 
                        variant="secondary" 
                        onClick={onClickBack}
                    >
                        Atrás
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={nextHandler}
                    >
                        Siguiente
                    </Button>
                </div>
            </Form>
        </Container>
    );
};

export default CalibrationForm;
