import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';

function AlertDismissible( {show = false,message="",showHandler = ()=>{}}) {
  // const [show, setShow] = useState(true);

  return (
    <>
      <Alert show={show} variant="success" style={
        {position:"absolute",
        transform:"translate(-50%, -50%)",
        top:"50%",
        left:"50%"
        }}>
        <Alert.Heading>Operacion exitosa</Alert.Heading>
        <p>
          {message}
        </p>
        <hr />
        <div className="d-flex justify-content-end">
          <Button onClick={() => showHandler(false)} variant="outline-success">
            Close me
          </Button>
        </div>
      </Alert>

      {/* {!show && <Button onClick={() => setShow(true)}>Show Alert</Button>} */}
    </>
  );
}

export default AlertDismissible;
