import { useState, useEffect } from "react";
import { Button, Container, Form, Row, Col, Table } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AlertDismissible from "../components/Alert/AlertDismissible"; // Asegúrate de que el componente esté correctamente importado
import useFetch from "../customHooks/useFetch";

const CalibrationUnassistedPage = () => {
  const navigate = useNavigate();
  const arduinoData = useSelector((state) => state.arduino.data || []);
  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const [newWeight, setNewWeight] = useState("0");
  const [regressionParams, setRegressionParams] = useState({ m: 0, b: 0 });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { data, error, fetchData } = useFetch(
    "http://localhost:5000/save-calibration-data",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  // Calcular los parámetros de regresión lineal cuando cambian los puntos de calibración
  useEffect(() => {
    if (calibrationPoints.length >= 2) {
      const n = calibrationPoints.length;
      const sumX = calibrationPoints.reduce((sum, p) => sum + p.voltage, 0);
      const sumY = calibrationPoints.reduce((sum, p) => sum + p.weight, 0);
      const sumXY = calibrationPoints.reduce((sum, p) => sum + p.voltage * p.weight, 0);
      const sumX2 = calibrationPoints.reduce((sum, p) => sum + p.voltage ** 2, 0);

      const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
      const b = (sumY - m * sumX) / n;

      setRegressionParams({ m, b });
    }
  }, [calibrationPoints]);

  // Agregar un nuevo punto de calibración
  const addCalibrationPoint = () => {
    const lastVoltage =
      arduinoData.length > 0 ? arduinoData[arduinoData.length - 1].voltage : null;

    if (!newWeight || isNaN(newWeight)) {
      alert("Debe ingresar un peso válido.");
      return;
    }

    if (lastVoltage === null) {
      alert("No se ha recibido un voltaje válido desde el Arduino.");
      return;
    }

    setCalibrationPoints([
      ...calibrationPoints,
      { weight: parseFloat(newWeight), voltage: lastVoltage },
    ]);
    setNewWeight("");
  };

  // Finalizar y guardar la calibración
  const finalizeCalibration = async () => {
    if (calibrationPoints.length < 2) {
      alert("Debe tener al menos dos puntos de calibración.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const sendData = {
      name: "calibration_data",
      data: regressionParams,
    };

    try {
      fetchData(sendData);
    } catch (error) {
      setErrorMessage("Hubo un error al guardar los datos. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Manejar el éxito o error al guardar datos
  useEffect(() => {
    if (data) {
      alert("Calibración guardada correctamente.");
      navigate("/");
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      setErrorMessage("Hubo un error al guardar los datos de calibración. Intente nuevamente.");
    }
  }, [error]);

  // Volver a la página anterior
  const calibrationEnd = () => {
    navigate(-2);
  };

  return (
    <Container style={{ marginTop: "20px", position: "relative" }}>
      <h1>Calibración No Asistida</h1>
      <Row>
        {/* Columna del formulario */}
        <Col md={8}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Peso (en kg)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Ingrese el peso"
                value={newWeight}
                onChange={(e) => setNewWeight(calibrationPoints.length === 0 ? 0 : e.target.value)}
                disabled={calibrationPoints.length === 0 }
              />
            </Form.Group>
            <Button variant="primary" onClick={addCalibrationPoint}>
              Agregar Punto
            </Button>
          </Form>

          {/* Tabla de puntos */}
          <Table striped bordered hover className="mt-4">
            <thead>
              <tr>
                <th>#</th>
                <th>Peso (kg)</th>
                <th>Voltaje (V)</th>
              </tr>
            </thead>
            <tbody>
              {calibrationPoints.map((point, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{point.weight.toFixed(2)}</td>
                  <td>{point.voltage.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="mt-4">
            <Button
              variant="success"
              onClick={finalizeCalibration}
              disabled={loading || calibrationPoints.length < 2}
            >
              {loading ? "Guardando..." : "Finalizar Calibración"}
            </Button>
          </div>

          {errorMessage && <div className="alert alert-danger mt-3">{errorMessage}</div>}

          <AlertDismissible
            show={data !== null}
            message="Calibración completada con éxito."
            showHandler={calibrationEnd}
          />
        </Col>

        {/* Columna de la gráfica */}
        <Col md={4}>
          <div className="mt-4">
            <h3>Gráfica de Calibración</h3>
            <Line
              data={{
                labels: calibrationPoints.map((p) => p.voltage),
                datasets: [
                  {
                    label: "Puntos de calibración",
                    data: calibrationPoints.map((p) => p.weight),
                    borderColor: "rgba(75,192,192,1)",
                    fill: false,
                    showLine: false, // Puntos individuales
                    pointBackgroundColor: "rgba(75,192,192,1)",
                  },
                  {
                    label: "Línea de ajuste",
                    data: calibrationPoints.map(
                      (p) => regressionParams.m * p.voltage + regressionParams.b
                    ),
                    borderColor: "rgba(255,99,132,1)",
                    fill: false,
                    showLine: true, // Línea de ajuste
                  },
                ],
              }}
            />
            <p>
              <strong>Pendiente (m):</strong> {regressionParams.m.toFixed(4)} <br />
              <strong>Intersección (b):</strong> {regressionParams.b.toFixed(4)}
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default CalibrationUnassistedPage;


// import { useState, useEffect } from "react";
// import { Button, Container, Form, Row, Col, Table } from "react-bootstrap";
// import { Line } from "react-chartjs-2";
// import { useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import AlertDismissible from "../components/Alert/AlertDismissible"; // Asegúrate de que el componente esté correctamente importado
// import useFetch from "../customHooks/useFetch";

// const CalibrationUnassistedPage = () => {
//   const navigate = useNavigate();
//   const arduinoData = useSelector((state) => state.arduino.data || []);
//   const [calibrationPoints, setCalibrationPoints] = useState([]);
//   const [newWeight, setNewWeight] = useState("");
//   const [regressionParams, setRegressionParams] = useState({ m: 0, b: 0 });
//   const [loading, setLoading] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");
//   const { data, error, fetchData } = useFetch(
//     "http://localhost:5000/save-calibration-data",
//     {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//     }
//   );

//   useEffect(() => {
//     if (calibrationPoints.length === 2) {
//       // Calcular pendiente y ajuste de regresión
//       const [point1, point2] = calibrationPoints;
//       const m =
//         (point2.weight - point1.weight) / (point2.voltage - point1.voltage);
//       const b = point1.weight - m * point1.voltage;
//       setRegressionParams({ m, b });
//     }
//   }, [calibrationPoints]);

//   const addCalibrationPoint = () => {
//     const lastVoltage =
//       arduinoData.length > 0 ? arduinoData[arduinoData.length - 1].voltage : null;

//     if (!newWeight || isNaN(newWeight)) {
//       alert("Debe ingresar un peso válido.");
//       return;
//     }

//     if (lastVoltage === null) {
//       alert("No se ha recibido un voltaje válido desde el Arduino.");
//       return;
//     }

//     if (calibrationPoints.length >= 2) {
//       alert("Solo se necesitan dos puntos para la calibración.");
//       return;
//     }

//     setCalibrationPoints([
//       ...calibrationPoints,
//       { weight: parseFloat(newWeight), voltage: lastVoltage },
//     ]);
//     setNewWeight("");
//   };

//   const finalizeCalibration = async () => {
//     if (calibrationPoints.length !== 2) {
//       alert("Debe tener exactamente dos puntos de calibración.");
//       return;
//     }

//     setLoading(true);
//     setErrorMessage("");

//     const sendData = {
//       name: "calibration_data",
//       data: regressionParams,
//     };

//     try {
//       fetchData(sendData);
//     } catch (error) {
//       setErrorMessage("Hubo un error al guardar los datos. Intente nuevamente.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (data) {
//       alert("Calibración guardada correctamente.");
//       navigate("/");
//     }
//   }, [data]);

//   useEffect(() => {
//     if (error) {
//       setErrorMessage("Hubo un error al guardar los datos de calibración. Intente nuevamente.");
//     }
//   }, [error]);

//   const calibrationEnd = () => {
//     navigate(-2);
//   };

//   return (
//     <Container style={{ marginTop: "20px", position: "relative" }}>
//       <h1>Calibración No Asistida</h1>
//       <Row>
//         {/* Columna del formulario */}
//         <Col md={8}>
//           <Form>
//             <Form.Group className="mb-3">
//               <Form.Label>Peso (en kg)</Form.Label>
//               <Form.Control
//                 type="number"
//                 placeholder="Ingrese el peso"
//                 value={newWeight}
//                 onChange={(e) => setNewWeight(e.target.value)}
//               />
//             </Form.Group>
//             <Button
//               variant="primary"
//               onClick={addCalibrationPoint}
//               disabled={calibrationPoints.length >= 2}
//             >
//               Agregar Punto
//             </Button>
//           </Form>

//           {/* Tabla de puntos */}
//           <Table striped bordered hover className="mt-4">
//             <thead>
//               <tr>
//                 <th>#</th>
//                 <th>Peso (kg)</th>
//                 <th>Voltaje (V)</th>
//               </tr>
//             </thead>
//             <tbody>
//               {calibrationPoints.map((point, index) => (
//                 <tr key={index}>
//                   <td>{index + 1}</td>
//                   <td>{point.weight.toFixed(2)}</td>
//                   <td>{point.voltage.toFixed(2)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>

//           <div className="mt-4">
//             <Button
//               variant="success"
//               onClick={finalizeCalibration}
//               disabled={loading || calibrationPoints.length !== 2}
//             >
//               {loading ? "Guardando..." : "Finalizar Calibración"}
//             </Button>
//           </div>

//           {errorMessage && <div className="alert alert-danger mt-3">{errorMessage}</div>}

//           <AlertDismissible
//             show={data !== null}
//             message="Calibración completada con éxito."
//             showHandler={calibrationEnd}
//           />
//         </Col>

//         {/* Columna de la gráfica */}
//         <Col md={4}>
//           <div className="mt-4">
//             <h3>Gráfica de Calibración</h3>
//             <Line
//               data={{
//                 labels: calibrationPoints.map((v) => v.voltage),
//                 datasets: [
//                   {
//                     label: "Voltaje vs Peso",
//                     data: calibrationPoints.map(
//                       (v) => regressionParams.m * v.voltage + regressionParams.b
//                     ),
//                     borderColor: "rgba(75,192,192,1)",
//                     fill: false,
//                   },
//                 ],
//               }}
//             />
//             <p>
//               <strong>Pendiente (m):</strong> {regressionParams.m.toFixed(4)} <br />
//               <strong>Intersección (b):</strong> {regressionParams.b.toFixed(4)}
//             </p>
//           </div>
//         </Col>
//       </Row>
//     </Container>
//   );
// };

// export default CalibrationUnassistedPage;



// // import { useState, useEffect } from "react";
// // import { Button, Container, Form, Row, Col, Table } from "react-bootstrap";
// // import { Line } from "react-chartjs-2";
// // import { useNavigate } from "react-router-dom";
// // import { useSelector } from "react-redux";
// // import AlertDismissible from "../components/Alert/AlertDismissible"; // Asegúrate de que el componente AlertDismissible esté correctamente importado
// // import useFetch from "../customHooks/useFetch";

// // const CalibrationUnassistedPage = () => {
// //   const navigate = useNavigate();
// //   const arduinoData = useSelector((state) => state.arduino.data || []);
// //   const [calibrationValues, setCalibrationValues] = useState([]);
// //   const [newWeight, setNewWeight] = useState("");
// //   const [showAlert, setShowAlert] = useState(false);
// //   const [regressionParams, setRegressionParams] = useState({ m: 0, b: 0 });
// //   const [loading, setLoading] = useState(false); // Estado de carga para mostrar el spinner o mensaje de espera
// //   const [errorMessage, setErrorMessage] = useState(""); // Para mostrar un mensaje de error si es necesario
// //   const { data, error, loading: fetchLoading, fetchData } = useFetch(
// //     "http://localhost:5000/save-calibration-data",
// //     {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //     }
// //   );

// //   useEffect(() => {
// //     // Recalcular los parámetros de regresión cada vez que se agregue un nuevo punto
// //     if (calibrationValues.length >= 2) {
// //       const x = calibrationValues.map((v) => v.voltage);
// //       const y = calibrationValues.map((v) => v.weight);
// //       const { m, b } = calculateLinearRegression(x, y);
// //       setRegressionParams({ m, b });
// //     }
// //   }, [calibrationValues]);

// //   const addCalibrationPoint = () => {
// //     const lastVoltage =
// //       arduinoData.length > 0 ? arduinoData[arduinoData.length - 1].voltage : null;

// //     if (!newWeight || isNaN(newWeight)) {
// //       alert("Debe ingresar un peso válido.");
// //       return;
// //     }

// //     if (lastVoltage === null ) {
// //       alert("No se ha recibido un voltaje válido desde el Arduino.");
// //       return;
// //     }

// //     setCalibrationValues([
// //       ...calibrationValues,
// //       { weight: parseFloat(newWeight), voltage: lastVoltage },
// //     ]);
// //     setNewWeight("");
// //   };

// //   const removeCalibrationPoint = (index) => {
// //     const updatedValues = calibrationValues.filter((_, i) => i !== index);
// //     setCalibrationValues(updatedValues);
// //   };

// //   const finalizeCalibration = async () => {
// //     if (calibrationValues.length < 2) {
// //       alert("Debe tener al menos dos puntos de calibración.");
// //       return;
// //     }

// //     setLoading(true); // Activar el estado de carga (spinner o mensaje de espera)
// //     setErrorMessage(""); // Limpiar cualquier mensaje de error previo

// //     const sendData = {
// //       name: "calibration_data",
// //       data: {
// //         m: regressionParams.m,
// //         b: 0,
// //       },
// //     };

// //     try {
// //       fetchData(sendData);
// //     } catch (error) {
// //       setErrorMessage("Hubo un error de conexión. Intente nuevamente.");
// //     } finally {
// //       setLoading(false); // Desactivar el estado de carga
// //     }
// //   };

// //   useEffect(()=>{
// //     if (data) {
// //         alert("Calibración guardada correctamente.");
// //         navigate("/"); // Redirigir si la respuesta es afirmativa
// //     }
// //   },[data])

// //   useEffect(() => {
// //     if (error) {
// //         setErrorMessage("Hubo un error al guardar los datos de calibración. Intente nuevamente.");
// //     }
// //   }, [error])
  

// //   const calculateLinearRegression = (x, y) => {
// //     const n = x.length;
// //     const sumX = x.reduce((a, b) => a + b, 0);
// //     const sumY = y.reduce((a, b) => a + b, 0);
// //     const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
// //     const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

// //     const m = (n * sumXY - sumX * sumY) / (n * sumX2 - Math.pow(sumX, 2));
// //     const b = (sumY - m * sumX) / n;

// //     return { m, b:0 };
// //   };

// //   const calibrationEnd = () => {
// //     setShowAlert(false);
// //     navigate(-2); // Navegar hacia atrás
// //   };

// //   return (
// //     <Container style={{ marginTop: "20px", position: "relative" }}>
// //   <h1>Calibración No Asistida</h1>
// //   <Row>
// //     {/* Columna del formulario y la tabla */}
// //     <Col md={8}>
// //       <Form>
// //         <Form.Group className="mb-3">
// //           <Form.Label>Peso (en kg)</Form.Label>
// //           <Form.Control
// //             type="number"
// //             placeholder="Ingrese el peso"
// //             value={newWeight}
// //             onChange={(e) => setNewWeight(e.target.value)}
// //           />
// //         </Form.Group>
// //         <Button variant="primary" onClick={addCalibrationPoint}>
// //           Agregar Lectura
// //         </Button>
// //       </Form>

// //       {/* Contenedor de la tabla con scroll */}
// //       <div style={{ maxHeight: "300px", overflowY: "auto", marginTop: "20px" }}>
// //         <Table striped bordered hover>
// //           <thead>
// //             <tr>
// //               <th>#</th>
// //               <th>Peso (kg)</th>
// //               <th>Voltaje (V)</th>
// //               <th>Acciones</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {calibrationValues.slice().reverse().map((value, index) => (
// //               <tr key={index}>
// //                 <td>{index + 1}</td>
// //                 <td>{value.weight}</td>
// //                 <td>{value.voltage.toFixed(6)}</td>
// //                 <td>
// //                   <Button variant="danger" onClick={() => removeCalibrationPoint(index)}>
// //                     Eliminar
// //                   </Button>
// //                 </td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </Table>
// //       </div>

// //       {/* Botón de finalizar calibración */}
// //       <div className="mt-4">
// //         <Button variant="success" onClick={finalizeCalibration} disabled={loading}>
// //           {loading ? "Guardando..." : "Finalizar Calibración"}
// //         </Button>
// //       </div>

// //       {errorMessage && <div className="alert alert-danger mt-3">{errorMessage}</div>}

// //       <AlertDismissible
// //         show={showAlert}
// //         message="Calibración completada con éxito."
// //         showHandler={calibrationEnd}
// //       />
// //     </Col>

// //     {/* Columna de la gráfica */}
// //     <Col md={4}>
// //       <div className="mt-4">
// //         <h3>Gráfica de Calibración</h3>
// //         <Line
// //           data={{
// //             labels: calibrationValues.map((v) => v.voltage),
// //             datasets: [
// //               {
// //                 label: "Voltaje vs Peso",
// //                 data: calibrationValues.map(
// //                   (v) => regressionParams.m * v.voltage + regressionParams.b
// //                 ),
// //                 borderColor: "rgba(75,192,192,1)",
// //                 fill: false,
// //               },
// //             ],
// //           }}
// //         />
// //         <p>
// //           <strong>Pendiente (m):</strong> {regressionParams.m.toFixed(4)} <br />
// //           <strong>Intersección (b):</strong> {regressionParams.b.toFixed(4)}
// //         </p>
// //       </div>
// //     </Col>
// //   </Row>
// // </Container>

// //   );
// // };

// // export default CalibrationUnassistedPage;


// // // import AlertDismissible from "../components/Alert/AlertDismissible";
// // // import { Line } from "react-chartjs-2";

// // // const CalibrationUnassistedPage = () => {
// // //   const navigate = useNavigate();
// // //   const arduinoData = useSelector((state) => state.arduino.data || []);
// // //   const [calibrationValues, setCalibrationValues] = useState([]);
// // //   const [newWeight, setNewWeight] = useState("");
// // //   const [showAlert, setShowAlert] = useState(false);
// // //   const [regressionParams, setRegressionParams] = useState({ m: 0, b: 0 });

// // //   useEffect(() => {
// // //     console.log("Puntos de calibración actualizados:", calibrationValues);
// // //   }, [calibrationValues]);

// // //   const addCalibrationPoint = () => {
// // //     const lastVoltage = arduinoData.length > 0 ? arduinoData[arduinoData.length - 1].voltage : null;

// // //     if (!newWeight || isNaN(newWeight)) {
// // //       alert("Debe ingresar un peso válido.");
// // //       return;
// // //     }

// // //     if (lastVoltage === null || lastVoltage === 0) {
// // //       alert("No se ha recibido un voltaje válido desde el Arduino.");
// // //       return;
// // //     }

// // //     setCalibrationValues([
// // //       ...calibrationValues,
// // //       { weight: parseFloat(newWeight), voltage: lastVoltage },
// // //     ]);
// // //     setNewWeight("");
// // //   };

// // //   const removeCalibrationPoint = (index) => {
// // //     const updatedValues = calibrationValues.filter((_, i) => i !== index);
// // //     setCalibrationValues(updatedValues);
// // //   };

// // //   const finalizeCalibration = () => {
// // //     if (calibrationValues.length < 2) {
// // //       alert("Debe tener al menos dos puntos de calibración.");
// // //       return;
// // //     }

// // //     const x = calibrationValues.map((v) => v.voltage);
// // //     const y = calibrationValues.map((v) => v.weight);

// // //     const { m, b } = calculateLinearRegression(x, y);

// // //     setRegressionParams({ m, b });

// // //     alert(`Calibración completada con éxito. Parámetros calculados: m = ${m.toFixed(4)}, b = ${b.toFixed(4)}`);
// // //   };

// // //   const calculateLinearRegression = (x, y) => {
// // //     const n = x.length;
// // //     const sumX = x.reduce((a, b) => a + b, 0);
// // //     const sumY = y.reduce((a, b) => a + b, 0);
// // //     const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
// // //     const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

// // //     const m = (n * sumXY - sumX * sumY) / (n * sumX2 - Math.pow(sumX, 2));
// // //     const b = (sumY - m * sumX) / n;

// // //     return { m, b };
// // //   };

// // //   const calibrationEnd = () => {
// // //     setShowAlert(false);
// // //     navigate(-2);
// // //   };

// // //   return (
// // //     <Container style={{ marginTop: "20px", position: "relative" }}>
// // //       <h1>Calibración No Asistida</h1>
// // //       <Row>
// // //         {/* Columna del formulario y la tabla */}
// // //         <Col md={8}>
// // //           <Form>
// // //             <Form.Group className="mb-3">
// // //               <Form.Label>Peso (en kg)</Form.Label>
// // //               <Form.Control
// // //                 type="number"
// // //                 placeholder="Ingrese el peso"
// // //                 value={newWeight}
// // //                 onChange={(e) => setNewWeight(e.target.value)}
// // //               />
// // //             </Form.Group>
// // //             <Button variant="primary" onClick={addCalibrationPoint}>
// // //               Agregar Lectura
// // //             </Button>
// // //           </Form>

// // //           <Table striped bordered hover className="mt-4">
// // //             <thead>
// // //               <tr>
// // //                 <th>#</th>
// // //                 <th>Peso (kg)</th>
// // //                 <th>Voltaje (V)</th>
// // //                 <th>Acciones</th>
// // //               </tr>
// // //             </thead>
// // //             <tbody>
// // //               {calibrationValues.map((value, index) => (
// // //                 <tr key={index}>
// // //                   <td>{index + 1}</td>
// // //                   <td>{value.weight}</td>
// // //                   <td>{value.voltage.toFixed(6)}</td>
// // //                   <td>
// // //                     <Button variant="danger" onClick={() => removeCalibrationPoint(index)}>
// // //                       Eliminar
// // //                     </Button>
// // //                   </td>
// // //                 </tr>
// // //               ))}
// // //             </tbody>
// // //           </Table>

// // //           <div className="mt-4">
// // //             <Button variant="success" onClick={finalizeCalibration}>
// // //               Finalizar Calibración
// // //             </Button>
// // //           </div>

// // //           <AlertDismissible
// // //             show={showAlert}
// // //             message="Calibración completada con éxito."
// // //             showHandler={calibrationEnd}
// // //           />
// // //         </Col>

// // //         {/* Columna de la gráfica */}
// // //         <Col md={4}>
// // //           {/* {regressionParams. && ( */}
// // //             <div className="mt-4">
// // //               <h3>Gráfica de Calibración</h3>
// // //               <Line
// // //                 data={{
// // //                   labels: calibrationValues.map((v) => v.voltage),
// // //                   datasets: [
// // //                     {
// // //                       label: "Voltaje vs Peso",
// // //                       data: calibrationValues.map(
// // //                         (v) => regressionParams.m * v.voltage + regressionParams.b
// // //                       ),
// // //                       borderColor: "rgba(75,192,192,1)",
// // //                       fill: false,
// // //                     },
// // //                   ],
// // //                 }}
// // //               />
// // //               <p>
// // //                 <strong>Pendiente (m):</strong> {regressionParams.m.toFixed(4)}{" "}
// // //                 <br />
// // //                 <strong>Intersección (b):</strong> {regressionParams.b.toFixed(4)}
// // //               </p>
// // //             </div>
// // //           {/* )} */}
// // //         </Col>
// // //       </Row>
// // //     </Container>
// // //   );
// // // };

// // // export default CalibrationUnassistedPage;


// // // import React, { useEffect, useState } from "react";
// // // import { Container, Form, Button, Table } from "react-bootstrap";
// // // import { useSelector } from "react-redux";
// // // import { useNavigate } from "react-router-dom";
// // // import AlertDismissible from "../components/Alert/AlertDismissible";
// // // import { Line } from "react-chartjs-2";

// // // const CalibrationUnassistedPage = () => {
// // //   const navigate = useNavigate();
// // //   const arduinoData = useSelector((state) => state.arduino.data || []);
// // //   const [calibrationValues, setCalibrationValues] = useState([]);
// // //   const [newWeight, setNewWeight] = useState("");
// // //   const [showAlert, setShowAlert] = useState(false);
// // //   const [regressionParams, setRegressionParams] = useState(null);

// // //   useEffect(() => {
// // //     console.log("Puntos de calibración actualizados:", calibrationValues);
// // //   }, [calibrationValues]);

// // //   const addCalibrationPoint = () => {
// // //     const lastVoltage = arduinoData.length > 0 ? arduinoData[arduinoData.length - 1].voltage : null;

// // //     if (!newWeight || isNaN(newWeight)) {
// // //       alert("Debe ingresar un peso válido.");
// // //       return;
// // //     }

// // //     if (lastVoltage === null || lastVoltage === 0) {
// // //       alert("No se ha recibido un voltaje válido desde el Arduino.");
// // //       return;
// // //     }

// // //     setCalibrationValues([
// // //       ...calibrationValues,
// // //       { weight: parseFloat(newWeight), voltage: lastVoltage },
// // //     ]);
// // //     setNewWeight("");
// // //   };

// // //   const removeCalibrationPoint = (index) => {
// // //     const updatedValues = calibrationValues.filter((_, i) => i !== index);
// // //     setCalibrationValues(updatedValues);
// // //   };

// // //   const finalizeCalibration = () => {
// // //     if (calibrationValues.length < 2) {
// // //       alert("Debe tener al menos dos puntos de calibración.");
// // //       return;
// // //     }

// // //     const x = calibrationValues.map((v) => v.voltage);
// // //     const y = calibrationValues.map((v) => v.weight);

// // //     const { m, b } = calculateLinearRegression(x, y);

// // //     setRegressionParams({ m, b });

// // //     alert(`Calibración completada con éxito. Parámetros calculados: m = ${m.toFixed(4)}, b = ${b.toFixed(4)}`);
// // //   };

// // //   const calculateLinearRegression = (x, y) => {
// // //     const n = x.length;
// // //     const sumX = x.reduce((a, b) => a + b, 0);
// // //     const sumY = y.reduce((a, b) => a + b, 0);
// // //     const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
// // //     const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

// // //     const m = (n * sumXY - sumX * sumY) / (n * sumX2 - Math.pow(sumX, 2));
// // //     const b = (sumY - m * sumX) / n;

// // //     return { m, b };
// // //   };

// // //   const calibrationEnd = () => {
// // //     setShowAlert(false);
// // //     navigate(-2);
// // //   };

// // //   return (
// // //     <Container style={{ marginTop: "20px", position: "relative" }}>
// // //       <h1>Calibración No Asistida</h1>
// // //       <Form>
// // //         <Form.Group className="mb-3">
// // //           <Form.Label>Peso (en kg)</Form.Label>
// // //           <Form.Control
// // //             type="number"
// // //             placeholder="Ingrese el peso"
// // //             value={newWeight}
// // //             onChange={(e) => setNewWeight(e.target.value)}
// // //           />
// // //         </Form.Group>
// // //         <Button variant="primary" onClick={addCalibrationPoint}>
// // //           Agregar Lectura
// // //         </Button>
// // //       </Form>

// // //       <Table striped bordered hover className="mt-4">
// // //         <thead>
// // //           <tr>
// // //             <th>#</th>
// // //             <th>Peso (kg)</th>
// // //             <th>Voltaje (V)</th>
// // //             <th>Acciones</th>
// // //           </tr>
// // //         </thead>
// // //         <tbody>
// // //           {calibrationValues.map((value, index) => (
// // //             <tr key={index}>
// // //               <td>{index + 1}</td>
// // //               <td>{value.weight}</td>
// // //               <td>{value.voltage.toFixed(6)}</td>
// // //               <td>
// // //                 <Button variant="danger" onClick={() => removeCalibrationPoint(index)}>
// // //                   Eliminar
// // //                 </Button>
// // //               </td>
// // //             </tr>
// // //           ))}
// // //         </tbody>
// // //       </Table>

// // //       <div className="mt-4">
// // //         <Button variant="success" onClick={finalizeCalibration}>
// // //           Finalizar Calibración
// // //         </Button>
// // //       </div>

// // //       {regressionParams && (
// // //         <div className="mt-4">
// // //           <h3>Gráfica de Calibración</h3>
// // //           <Line
// // //             data={{
// // //               labels: calibrationValues.map((v) => v.voltage),
// // //               datasets: [
// // //                 {
// // //                   label: "Voltaje vs Peso",
// // //                   data: calibrationValues.map(
// // //                     (v) => regressionParams.m * v.voltage + regressionParams.b
// // //                   ),
// // //                   borderColor: "rgba(75,192,192,1)",
// // //                   fill: false,
// // //                 },
// // //               ],
// // //             }}
// // //           />
// // //           <p>
// // //             <strong>Pendiente (m):</strong> {regressionParams.m.toFixed(4)}{" "}
// // //             <br />
// // //             <strong>Intersección (b):</strong> {regressionParams.b.toFixed(4)}
// // //           </p>
// // //         </div>
// // //       )}

// // //       <AlertDismissible
// // //         show={showAlert}
// // //         message="Calibración completada con éxito."
// // //         showHandler={calibrationEnd}
// // //       />
// // //     </Container>
// // //   );
// // // };

// // // export default CalibrationUnassistedPage;


// // // // import React, { useEffect, useState } from "react";
// // // // import { Container, Form, Button, Table } from "react-bootstrap";
// // // // import { useSelector } from "react-redux";
// // // // import { useNavigate } from "react-router-dom";
// // // // import AlertDismissible from "../components/Alert/AlertDismissible";
// // // // import useFetch from "../customHooks/useFetch";
// // // // import { WEIGHT_UNITS } from "../utils/const";
// // // // import { Line } from "react-chartjs-2";

// // // // const CalibrationUnassistedPage = () => {
// // // //   const navigate = useNavigate();
// // // //   const arduinoData = useSelector((state) => state.arduino.data || []); // Asegúrate de que el estado de Redux está definido
// // // //   const [calibrationValues, setCalibrationValues] = useState([]);
// // // //   const [newWeight, setNewWeight] = useState("");
// // // //   const [unit, setUnit] = useState(WEIGHT_UNITS.KilogramoFuerza);
// // // //   const [showAlert, setShowAlert] = useState(false);
// // // //   const { data, error, loading, fetchData } = useFetch("http://localhost:5000/save-calibration-data", {
// // // //     method: "POST",
// // // //     headers: { "Content-Type": "application/json" },
// // // //   });

// // // //   useEffect(() => {
// // // //     console.log("Puntos de calibración actualizados:", calibrationValues);
// // // //   }, [calibrationValues]);

// // // //   const addCalibrationPoint = () => {
// // // //     const lastVoltage = arduinoData.length > 0 ? arduinoData[arduinoData.length - 1].voltage : null;

// // // //     // Validación de los valores de peso y voltaje
// // // //     if (!newWeight || isNaN(newWeight)) {
// // // //       alert("Debe ingresar un peso válido.");
// // // //       return;
// // // //     }

// // // //     if (lastVoltage === null || lastVoltage === 0) {
// // // //       alert("No se ha recibido un voltaje válido desde el Arduino.");
// // // //       return;
// // // //     }

// // // //     const barValue = convertToBares(unit, parseFloat(newWeight));
// // // //     setCalibrationValues([
// // // //       ...calibrationValues,
// // // //       { weight: parseFloat(newWeight), voltage: lastVoltage, bar: barValue },
// // // //     ]);
// // // //     setNewWeight("");
// // // //   };

// // // //   const removeCalibrationPoint = (index) => {
// // // //     const updatedValues = calibrationValues.filter((_, i) => i !== index);
// // // //     setCalibrationValues(updatedValues);
// // // //   };

// // // //   const finalizeCalibration = () => {
// // // //     if (calibrationValues.length < 2) {
// // // //       alert("Debe tener al menos dos puntos de calibración.");
// // // //       return;
// // // //     }

// // // //     const x = calibrationValues.map((v) => v.voltage);
// // // //     const y = calibrationValues.map((v) => v.bar);

// // // //     const { m, b } = calculateLinearRegression(x, y);

// // // //     const sendData = {
// // // //       name: "calibration_data",
// // // //       data: { m, b },
// // // //     };

// // // //     fetchData(sendData);
// // // //     alert(`Calibración completada con éxito. Parámetros calculados: m = ${m.toFixed(4)}, b = ${b.toFixed(4)}`);
// // // //   };

// // // //   const calculateLinearRegression = (x, y) => {
// // // //     const n = x.length;
// // // //     const sumX = x.reduce((a, b) => a + b, 0);
// // // //     const sumY = y.reduce((a, b) => a + b, 0);
// // // //     const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
// // // //     const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

// // // //     const m = (n * sumXY - sumX * sumY) / (n * sumX2 - Math.pow(sumX, 2));
// // // //     const b = (sumY - m * sumX) / n;

// // // //     return { m, b };
// // // //   };

// // // //   const convertToBares = (unit, value) => {
// // // //     const areaCilindro = Math.PI * 0.08546620444; // Área en m^2
// // // //     const force = unit === WEIGHT_UNITS.KilogramoFuerza ? value * 9.81 : value; // Convertir a Newtons
// // // //     const pressurePascals = force / areaCilindro; // Presión en Pascales
// // // //     return pressurePascals / 100000; // Conversión a bares
// // // //   };

// // // //   useEffect(() => {
// // // //     if (data) {
// // // //       setShowAlert(true);
// // // //     }
// // // //   }, [data]);

// // // //   const calibrationEnd = () => {
// // // //     setShowAlert(false);
// // // //     navigate(-2);
// // // //   };

// // // //   return (
// // // //     <Container style={{ marginTop: "20px", position: "relative" }}>
// // // //       <h1>Calibración No Asistida</h1>
// // // //       <Form>
// // // //         <Form.Group className="mb-3">
// // // //           <Form.Label>Peso (en {unit})</Form.Label>
// // // //           <Form.Control
// // // //             type="number"
// // // //             placeholder="Ingrese el peso"
// // // //             value={newWeight}
// // // //             onChange={(e) => setNewWeight(e.target.value)}
// // // //           />
// // // //         </Form.Group>
// // // //         <Form.Group className="mb-3">
// // // //           <Form.Label>Unidades</Form.Label>
// // // //           <Form.Select
// // // //             value={unit}
// // // //             onChange={(e) => setUnit(e.target.value)}
// // // //             disabled={calibrationValues.length > 0}
// // // //           >
// // // //             {Object.keys(WEIGHT_UNITS).map((key, index) => (
// // // //               <option key={index} value={WEIGHT_UNITS[key]}>
// // // //                 {WEIGHT_UNITS[key]}
// // // //               </option>
// // // //             ))}
// // // //           </Form.Select>
// // // //         </Form.Group>
// // // //         <Button variant="primary" onClick={addCalibrationPoint}>
// // // //           Agregar Lectura
// // // //         </Button>
// // // //       </Form>

// // // //       <Table striped bordered hover className="mt-4">
// // // //         <thead>
// // // //           <tr>
// // // //             <th>#</th>
// // // //             <th>Peso</th>
// // // //             <th>Voltaje</th>
// // // //             <th>Bares</th>
// // // //             <th>Acciones</th>
// // // //           </tr>
// // // //         </thead>
// // // //         <tbody>
// // // //           {calibrationValues.map((value, index) => (
// // // //             <tr key={index}>
// // // //               <td>{index + 1}</td>
// // // //               <td>{value.weight}</td>
// // // //               <td>{value.voltage}</td>
// // // //               <td>{value.bar.toFixed(4)}</td>
// // // //               <td>
// // // //                 <Button variant="danger" onClick={() => removeCalibrationPoint(index)}>
// // // //                   Eliminar
// // // //                 </Button>
// // // //               </td>
// // // //             </tr>
// // // //           ))}
// // // //         </tbody>
// // // //       </Table>

// // // //       <div className="mt-4">
// // // //         <Button variant="success" onClick={finalizeCalibration}>
// // // //           Finalizar Calibración
// // // //         </Button>
// // // //       </div>

// // // //       {calibrationValues.length > 1 && (
// // // //         <div className="mt-4">
// // // //           <h3>Gráfica de Calibración</h3>
// // // //           <Line
// // // //             data={{
// // // //               labels: calibrationValues.map((v) => v.voltage),
// // // //               datasets: [
// // // //                 {
// // // //                   label: "Voltaje vs Peso",
// // // //                   data: calibrationValues.map((v) => v.bar),
// // // //                   borderColor: "rgba(75,192,192,1)",
// // // //                   fill: false,
// // // //                 },
// // // //               ],
// // // //             }}
// // // //           />
// // // //         </div>
// // // //       )}

// // // //       <AlertDismissible show={showAlert} message="Calibración completada con éxito." showHandler={calibrationEnd} />
// // // //     </Container>
// // // //   );
// // // // };

// // // // export default CalibrationUnassistedPage;


// // // // // import React, { useEffect, useState } from 'react';
// // // // // import { Container, Form, Button, Table } from 'react-bootstrap';
// // // // // import { useSelector } from 'react-redux';
// // // // // import { useNavigate } from 'react-router-dom';
// // // // // import AlertDismissible from '../components/Alert/AlertDismissible';
// // // // // import useFetch from '../customHooks/useFetch';
// // // // // import { WEIGHT_UNITS } from '../utils/const';

// // // // // const CalibrationUnassistedPage = () => {
// // // // //     const navigate = useNavigate();
// // // // //     const { data: arduinoData } = useSelector((state) => state.arduino);
// // // // //     const [calibrationValues, setCalibrationValues] = useState([]);
// // // // //     const [newWeight, setNewWeight] = useState('');
// // // // //     const [unit, setUnit] = useState(WEIGHT_UNITS.KilogramoFuerza);
// // // // //     const [showAlert, setShowAlert] = useState(false);

// // // // //     const { data, error, loading, fetchData } = useFetch("http://localhost:5000/save-calibration-data", {
// // // // //         method: 'POST',
// // // // //         headers: { 'Content-Type': 'application/json' },
// // // // //     });

// // // // //     useEffect(() => {
// // // // //         console.log(calibrationValues);
// // // // //     }, [calibrationValues]);


// // // // //     const addCalibrationPoint = () => {
// // // // //         const lastVoltage = arduinoData.length > 0 ? arduinoData[arduinoData.length - 1].voltage : 0;

// // // // //         if (!newWeight || isNaN(newWeight) || lastVoltage === 0) {
// // // // //             alert("Debe ingresar un peso válido y obtener un voltaje.");
// // // // //             return;
// // // // //         }

// // // // //         const barValue = convertToBares(unit, parseFloat(newWeight));
// // // // //         setCalibrationValues([...calibrationValues, { weight: newWeight, voltage: lastVoltage, bar: barValue }]);
// // // // //         setNewWeight('');
// // // // //     };

// // // // //     const removeCalibrationPoint = (index) => {
// // // // //         const updatedValues = calibrationValues.filter((_, i) => i !== index);
// // // // //         setCalibrationValues(updatedValues);
// // // // //     };

// // // // //     const finalizeCalibration = () => {
// // // // //         if (calibrationValues.length < 2) {
// // // // //             alert("Debe tener al menos dos puntos de calibración.");
// // // // //             return;
// // // // //         }

// // // // //         // Cálculo de m y b usando regresión lineal
// // // // //         const x = calibrationValues.map(v => v.voltage);
// // // // //         const y = calibrationValues.map(v => v.bar);

// // // // //         const n = x.length;
// // // // //         const sumX = x.reduce((a, b) => a + b, 0);
// // // // //         const sumY = y.reduce((a, b) => a + b, 0);
// // // // //         const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
// // // // //         const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

// // // // //         const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
// // // // //         const b = (sumY - m * sumX) / n;

// // // // //         const sendData = {
// // // // //             name: "calibration_data",
// // // // //             data: { m, b },
// // // // //         };

// // // // //         fetchData(sendData);
// // // // //     };

// // // // //     const convertToBares = (unit, value) => {
// // // // //         const areaCilindro = Math.PI * 0.08546620444; // Área del cilindro en m^2
// // // // //         const force = unit === WEIGHT_UNITS.KilogramoFuerza ? value * 9.81 : value; // Convertir a Newtons si es necesario
// // // // //         const pressurePascals = force / areaCilindro; // Presión en Pascales
// // // // //         return pressurePascals / 100000; // Convertir a bares
// // // // //     };

// // // // //     useEffect(() => {
// // // // //         if (data) {
// // // // //             setShowAlert(true);
// // // // //         }
// // // // //     }, [data]);

// // // // //     const calibrationEnd = () => {
// // // // //         setShowAlert(false);
// // // // //         navigate(-2);
// // // // //     };

// // // // //     return (
// // // // //         <Container style={{ marginTop: '20px', position: "relative" }}>
// // // // //             <h1>Calibración No Asistida</h1>
// // // // //             <Form>
// // // // //                 <Form.Group className="mb-3">
// // // // //                     <Form.Label>Peso (en {unit})</Form.Label>
// // // // //                     <Form.Control
// // // // //                         type="number"
// // // // //                         placeholder="Ingrese el peso"
// // // // //                         value={newWeight}
// // // // //                         onChange={(e) => setNewWeight(e.target.value)}
// // // // //                     />
// // // // //                 </Form.Group>
// // // // //                 <Form.Group className="mb-3">
// // // // //                     <Form.Label>Unidades</Form.Label>
// // // // //                     <Form.Select value={unit} onChange={(e) => setUnit(e.target.value)} disabled={calibrationValues.length > 0}>
// // // // //                         {Object.keys(WEIGHT_UNITS).map((key, index) => (
// // // // //                             <option key={index} value={WEIGHT_UNITS[key]}>
// // // // //                                 {WEIGHT_UNITS[key]}
// // // // //                             </option>
// // // // //                         ))}
// // // // //                     </Form.Select>
// // // // //                 </Form.Group>
// // // // //                 <Button variant="primary" onClick={addCalibrationPoint}>
// // // // //                     Agregar Lectura
// // // // //                 </Button>
// // // // //             </Form>

// // // // //             <Table striped bordered hover className="mt-4">
// // // // //                 <thead>
// // // // //                     <tr>
// // // // //                         <th>#</th>
// // // // //                         <th>Peso</th>
// // // // //                         <th>Voltaje</th>
// // // // //                         <th>Bares</th>
// // // // //                         <th>Acciones</th>
// // // // //                     </tr>
// // // // //                 </thead>
// // // // //                 <tbody>
// // // // //                     {calibrationValues.map((value, index) => (
// // // // //                         <tr key={index}>
// // // // //                             <td>{index + 1}</td>
// // // // //                             <td>{value.weight}</td>
// // // // //                             <td>{value.voltage}</td>
// // // // //                             <td>{value.bar.toFixed(4)}</td>
// // // // //                             <td>
// // // // //                                 <Button variant="danger" onClick={() => removeCalibrationPoint(index)}>
// // // // //                                     Eliminar
// // // // //                                 </Button>
// // // // //                             </td>
// // // // //                         </tr>
// // // // //                     ))}
// // // // //                 </tbody>
// // // // //             </Table>

// // // // //             <div className="mt-4">
// // // // //                 <Button variant="success" onClick={finalizeCalibration}>
// // // // //                     Finalizar Calibración
// // // // //                 </Button>
// // // // //             </div>

// // // // //             <AlertDismissible show={showAlert} message="Calibración completada con éxito." showHandler={calibrationEnd} />
// // // // //         </Container>
// // // // //     );
// // // // // };

// // // // // export default CalibrationUnassistedPage;



// // // // // // CalibrationUnassistedPage.js
// // // // // import React, { useEffect, useState } from 'react';
// // // // // import { Container } from 'react-bootstrap';
// // // // // import CalibrationForm from '../components/CalibrationForm/CalibrationForm';
// // // // // import { useNavigate } from 'react-router-dom';
// // // // // import AlertDismissible from '../components/Alert/AlertDismissible';
// // // // // import useFetch from '../customHooks/useFetch';
// // // // // import { WEIGHT_UNITS } from '../utils/const';

// // // // // const CalibrationUnassistedPage = () => {
// // // // //     const [step, setStep] = useState(1)
// // // // //     const navigate = useNavigate();
// // // // //     const [params, setParams] = useState([])
// // // // //     const [showAlert, setShowAlert] = useState(false)
// // // // //     const { data, error, loading, fetchData } = useFetch("http://localhost:5000/save-calibration-data", {
// // // // //         method: 'POST',
// // // // //         headers: { 'Content-Type': 'application/json' },
// // // // //       });

// // // // //       useEffect(()=>{
// // // // //         console.log(params);
        
// // // // //       },[params])

// // // // //     const nextHandler = (data) => {
// // // // //         setParams([...params,data.data])
// // // // //         console.log(data.data);
        
        
// // // // //         data.step == "Paso 1" 
// // // // //         ? setStep(2)
// // // // //         : data.step == "Paso 2" 
// // // // //             && setStep(3)
        
// // // // //     }

// // // // //     useEffect(() => {
// // // // //         if (params && Object.keys(params).length >= 2 && step > 2) {
// // // // //             const m = (params[1].bar - params[0].bar)/(params[1].voltage - params[0].voltage)
// // // // //             const b = m*params[0].voltage
// // // // //             const sendData = {
// // // // //                 name: "calibration_data",
// // // // //                 data: {
// // // // //                     m: m,
// // // // //                     b: b
// // // // //                 },
// // // // //               };
// // // // //               fetchData(sendData); // Llamar a la función para enviar los datos
// // // // //         }
// // // // //     }, [params]);

    
    
// // // // //     // useEffect(()=>{
// // // // //     //     console.log(data); 
// // // // //     // },[data])


// // // // //     const calibrationEnd = () => {
// // // // //         setShowAlert(false)
// // // // //         navigate(-2)
// // // // //     }

// // // // //     useEffect(() => {
// // // // //         if (data) {
// // // // //             setShowAlert(true)
// // // // //         }
// // // // //     }, [data])

// // // // //     return (
// // // // //         <Container style={{ marginTop: '20px', position:"relative" }}>
// // // // //             <h1>Calibración No Asistida</h1>
// // // // //             {step == 1 
// // // // //                 ?<CalibrationForm 
// // // // //                     title='Paso 1'
// // // // //                     paragraph='1. Poner la maquina sin carga '
// // // // //                     disabled={true}
// // // // //                     onClickNext={nextHandler}
// // // // //                     onClickBack={() => navigate(-1)}
// // // // //                     />
// // // // //                 :step >= 2 
// // // // //                     && <CalibrationForm 
// // // // //                             title='Paso 2'
// // // // //                             paragraph='2. Poner en la maquina una carga conocida por ejemplo 1Kg'
// // // // //                             disabled={false}
// // // // //                             onClickBack={()=>setStep(1)}
// // // // //                             onClickNext={nextHandler}
// // // // //                             />}
// // // // //                 <AlertDismissible show = {showAlert} message='Se configuraron los parametros de calibracion' showHandler={calibrationEnd}/>
// // // // //         </Container>
// // // // //     );
// // // // // };

// // // // // export default CalibrationUnassistedPage;
