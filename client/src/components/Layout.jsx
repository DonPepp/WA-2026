import { Row, Col, Button, Alert } from 'react-bootstrap';
import { Outlet, Link, useNavigate } from 'react-router';
import { LoginButton, LogoutButton } from './Auth';

function NotFoundLayout(props) {
  const navigate = useNavigate();
  return (
    <>
      <h2>This route is not valid!</h2>
      <Button variant="primary" onClick={() => navigate('/')}>Back to Homepage</Button>
    </>
  );
}


function GenericLayout(props) {
  // Calcoliamo se l'utente è amministratore ed è loggato con TOTP 
  const isReadyAdmin = props.loggedIn && props.user?.is_admin && props.user?.isActive;
  const linkLabel = isReadyAdmin ? "All Reservations" : "My Reservations";

  return (
    <>
      <Row className="navbar bg-dark py-2 px-3 mb-3 align-items-center">
        <Col className="d-flex align-items-center">
          <Link to="/" className="text-white fw-bold fs-4 text-decoration-none me-4">
            🎭 Theater
          </Link>

          {props.loggedIn && (
            <>
              <Link
                to="/booking"
                className="text-white text-decoration-none ms-5 px-3 border-start border-white"
                style={{ fontSize: '16px' }}
              >
                <i className="bi bi-plus-circle me-1"></i> Book a Ticket
              </Link>
              <Link
                to="/reservations"
                className="text-white text-decoration-none ms-5 px-3 border-start border-white-50"
                style={{ fontSize: '16px' }}
              >
                <i className="bi bi-ticket-perforated mx-2"></i>
                {linkLabel}
              </Link>
            </>
          )}
        </Col>

        <Col className="text-end">
          {props.loggedIn ?
            <>
              <span className="text-white me-3">
                {props.user?.name}
                {props.user?.isActive ? ' 👑 ' : ''}
              </span>
              <LogoutButton logout={props.logout} />
            </>
            : <LoginButton />
          }
        </Col>
      </Row>

      <Row>
        <Col>
          {props.message ?
            <Alert className='my-1' onClose={() => props.setMessage(null)} variant={props.message.type} dismissible>
              {props.message.text}
            </Alert> : null}
        </Col>
      </Row>

      <Row>
        <Col>
          <Outlet />
        </Col>
      </Row>
    </>
  );
}


export { GenericLayout, NotFoundLayout };
