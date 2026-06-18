import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Routes, Route, Navigate, useNavigate } from 'react-router';

import { GenericLayout, NotFoundLayout } from './components/Layout';
import { LoginWithTotp } from './components/Auth';
import { Reservations } from './components/Reservations';
import { TicketLayout } from './components/TicketLayout';
import { Homepage } from './components/Homepage';


import API from './API.js';

function App() {
  const navigate = useNavigate();

  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [message, setMessage] = useState(null);


  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
      } catch (err) {

      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setUser(user);
      setLoggedIn(true);
    } catch (err) {
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await API.logOut();
    } catch (err) {
      console.log(err);
    } finally {
      setLoggedIn(false);
      setUser(null);
      setMessage(null);
      navigate('/');
    }
  };

  return (
    <Container fluid>
      <Routes>
        <Route path="/" element={
          <GenericLayout message={message} setMessage={setMessage} loggedIn={loggedIn} user={user} logout={handleLogout} />
        }>
          {/* Sub-routes */}
          <Route index element={<Homepage />} />
          <Route path="booking" element={
            loggedIn ? <TicketLayout setMessage={setMessage} user={user} /> : <Navigate replace to='/' />
          } />
          <Route path="reservations" element={
            loggedIn ? <Reservations setMessage={setMessage} user={user} /> : <Navigate replace to='/' />
          } />
          <Route path="login" element={
            <LoginWithTotp loggedIn={loggedIn} login={handleLogin} user={user} setUser={setUser} />
          } />

          <Route path="*" element={<NotFoundLayout />} />
        </Route>
      </Routes>
    </Container>
  );
}

export default App;