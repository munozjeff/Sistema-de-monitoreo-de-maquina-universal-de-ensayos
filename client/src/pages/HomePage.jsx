import React, { useEffect } from 'react';
import { Navbar, Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HomePage.style.css';
import useFetch from '../customHooks/useFetch';
import { useDispatch, useSelector } from 'react-redux';
import { setParametersCalibration } from '../redux/dataSlice';

const HomePage = () => {
    const url = `http://localhost:5000/load-calibration-data`;
    const { parameter_calibration } = useSelector((state) => state.data);
    const dispatch = useDispatch();
  
    // Usar el hook useFetch
    const { data, error, loading, fetchData } = useFetch(url);

    useEffect(() => {
        if (data) {
            dispatch(setParametersCalibration(data.data));
        }
    }, [data]);

    // useEffect(() => {
    //     console.log(parameter_calibration);
        
    // }, [parameter_calibration]);

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div id='home-page'>
            <Navbar style={{ backgroundColor: '#003366' }} variant="dark">
                <Navbar.Brand href="#home">Visualización de Datos</Navbar.Brand>
                <Navbar.Toggle />
                <Navbar.Collapse className="justify-content-end">
                    <Navbar.Text>
                        <a href="#about" style={{ color: '#FFD700' }}>Acerca de</a>
                    </Navbar.Text>
                </Navbar.Collapse>
            </Navbar>

            <Container className="mt-5 text-center">
                <Row>
                    <Col>
                        <h1>Bienvenido a la Aplicación de Ensayos</h1>
                        <p>Seleccione una opción para continuar:</p>
                    </Col>
                </Row>
                <Row className="mt-4">
                    <Col>
                        <Link to="/test">
                            <Button 
                                variant="primary" 
                                size="lg" 
                                onClick={() => console.log('Iniciar ensayos')}
                                style={{ width: '200px', margin: '10px' }}
                            >
                                Iniciar
                            </Button>
                        </Link>
                    </Col>
                    <Col>
                        <Link to="/calibration">
                            <Button 
                                variant="info" 
                                size="lg"
                                style={{ width: '200px', margin: '10px' }}
                            >
                                Calibración
                            </Button>
                        </Link>
                    </Col>
                </Row>
                <Row className="mt-5">
                    <Col>
                        <p>© 2024 - Visualización de Datos de la Máquina Universal de Ensayos Shimadzu</p>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default HomePage;