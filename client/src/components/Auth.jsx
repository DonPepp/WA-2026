import { useState } from 'react';
import { Form, Button, Alert, Col, Row, FloatingLabel } from 'react-bootstrap';
import { useNavigate, Navigate } from 'react-router';
import API from '../API.js';

function TotpForm(props) {
  const [totpCode, setTotpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  //console.log('DEBUG: RENDER TotpForm');

  const doTotpVerify = () => {
    API.totpVerify(totpCode)
      .then(() => {
        setErrorMessage('');
        API.getUserInfo()
          .then((user) => {
            props.setUser(user);
            navigate('/');
          })
          .catch((err) => {
            setErrorMessage('Failed to load updated user info.');
          });
      })
      .catch((err) => {
        if (err && err.error && err.error === "Not authorized") {
          setErrorMessage('Your session has expired, you will be redirected to the login page');
          setTimeout(() => props.setLoggedIn(false), 2000);
        } else {
          // NB: Must use a generic error message
          setErrorMessage('Wrong code, please try again');
        }
      })
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage('');

    // Some validation
    let valid = true;
    if (totpCode === '' || totpCode.length !== 6)
      valid = false;

    if (valid) {
      doTotpVerify(totpCode);
    } else {
      setErrorMessage('Invalid content in form: either empty or not 6-char long');
    }
  };

  return (
    <Row>
      <Col xs={4}></Col>
      <Col xs={4}>

        <h2 className="pb-3">Second Factor Authentication</h2>
        <h6>Please enter the code that you read on your device</h6>
        <Form onSubmit={handleSubmit}>
          {errorMessage ? <Alert variant='danger' dismissible onClick={() => setErrorMessage('')}>{errorMessage}</Alert> : ''}
          <FloatingLabel
            controlId="floatingTotpCode"
            label="Code"
            className="mb-3">
            <Form.Control
              type='text'
              value={totpCode}
              placeholder='Enter TOTP code'
              onChange={ev => setTotpCode(ev.target.value)} />
          </FloatingLabel>
          <Button className='my-2' type='submit'>Validate</Button>
          <Button className='my-2 mx-2' variant='danger' onClick={() => navigate('/')}>Enter as Normal User</Button>
        </Form>
      </Col>
      <Col xs={4}></Col>
    </Row>
  )

}

function LoginForm(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = { username, password };

    if (!username) {
      setErrorMessage('Username cannot be empty');
    } else if (!password) {
      setErrorMessage('Password cannot be empty');
    } else {
      props.login(credentials)
        .catch((err) => {
          setErrorMessage(err.error);
        });
    }
  };

  return (
    <Row>
      <Col xs={4}></Col>
      <Col xs={4}>
        <h1 className="pb-3">Login</h1>

        <Form onSubmit={handleSubmit}>
          {errorMessage ? <Alert dismissible onClose={() => setErrorMessage('')} variant="danger">{errorMessage}</Alert> : null}
          <FloatingLabel
            controlId="floatingEmail"
            label="Email"
            className="mb-3">
            <Form.Control
              type="email"
              value={username}
              placeholder='name@example.it'
              onChange={ev => setUsername(ev.target.value)} />
          </FloatingLabel>
          <FloatingLabel
            controlId="floatingPassword"
            label="Password"
            className="mb-3">
            <Form.Control type="password"
              placeholder="Enter your password"
              value={password}
              onChange={ev => setPassword(ev.target.value)} />
          </FloatingLabel>
          <Button className="mt-3" type="submit">Login</Button>
        </Form>
      </Col>
      <Col xs={4}></Col>
    </Row>

  )
};

function LogoutButton(props) {
  return (
    <Button variant="outline-light" onClick={props.logout}>Logout</Button>
  )
}

function LoginButton(props) {
  const navigate = useNavigate();
  return (
    <Button variant="outline-light" onClick={() => navigate('/login')}>Login</Button>
  )
}

function LoginWithTotp(props) {
  if (props.loggedIn) {
    if (props.user && props.user.is_admin === 1) {
      if (props.user.isActive) {
        return <Navigate replace to='/' />;
      } else {
        return <TotpLayout setUser={props.setUser} setLoggedIn={props.setLoggedIn} />;
      }
    } else {
      return <Navigate replace to='/' />;
    }
  } else {
    return <LoginLayout login={props.login} />;
  }
}

function LoginLayout(props) {
  return <LoginForm login={props.login} />;
}

function TotpLayout(props) {
  return <TotpForm setUser={props.setUser} setLoggedIn={props.setLoggedIn} />;
}

export { LoginForm, LogoutButton, LoginButton, TotpForm, LoginWithTotp };