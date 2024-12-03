// CalibrationPage.js
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import './CalibrationPage.style.css'
import { useDispatch, useSelector } from 'react-redux';
import { clearData } from '../redux/arduinoSlice';

const CalibrationPage = () => {
    const navigate = useNavigate();
    const arduinoData = useSelector((state) => state.arduino);
    const dispatch = useDispatch();
    const [disabled, setDisabled] = useState(true)

    // Reiniciar estado data al montar el componente
    useEffect(() => {
        dispatch(clearData());
    }, [dispatch]);

    useEffect(()=>{
        // console.log(arduinoData.data);
        
        if(arduinoData.data.length > 0 && arduinoData.connected){
            setDisabled(false)
        }
        else{
            setDisabled(true)
        }
        
    },[arduinoData])


    return (
        <Container id='calibration-page'>
            <h1>Página de Calibración</h1>
            <p>Seleccione el tipo de calibración:</p>
            {/* <Row className="mt-4 option-calibration">
                <Col md={6} lg={4}>
                    <Card style={{ width: '100%', margin: '10px' }}>
                        <Card.Body>
                            <Card.Title>Calibración Asistida</Card.Title>
                            <Card.Text>
                                Sigue instrucciones guiadas para realizar la calibración paso a paso.
                            </Card.Text>
                            <Link to="assisted">
                                <Button variant="success" size="lg" style={{ width: '100%' }}>
                                    Calibración Asistida
                                </Button>
                            </Link>
                        </Card.Body>
                    </Card>
                </Col> */}
                {/* <Col md={6} lg={4}> */}
                    <Card style={{ width: '100%', margin: '10px' }}>
                        <Card.Body>
                            <Card.Title>Calibración No Asistida</Card.Title>
                            <Card.Text>
                                Realiza la calibración sin guía, ideal para usuarios avanzados.
                            </Card.Text>
                            <Link to={disabled ? '#' : 'unassisted'}>
                                <Button disabled={disabled} variant="warning" size="lg" style={{ width: '100%' }}>
                                    Calibración No Asistida
                                </Button>
                            </Link>
                        </Card.Body>
                    </Card>
                {/* </Col> */}
            {/* </Row>
            <Row className="mt-4">
                <Col className="text-start">
                    <Button 
                        variant="secondary" 
                        onClick={() => navigate(-1)} 
                        style={{ width: '200px' }}
                    >
                        Regresar
                    </Button>
                </Col>
            </Row> */}
        </Container>
    );
};

export default CalibrationPage;
