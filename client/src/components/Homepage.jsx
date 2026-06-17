import { useState, useEffect } from 'react';
import { Spinner, Alert } from 'react-bootstrap';
import { TheaterMap } from './SeatLayout.jsx';

import API from '../API';

function Homepage() {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.getSeats()
      .then(data => setSeats(data))
      .catch(err => setError(err.error || 'Error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="w-100 px-3">
      <TheaterMap seats={seats} selectable={false} />
    </div>
  );
}

export { Homepage };