import { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Alert, Card, Tab, Tabs } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { TheaterMap } from './SeatLayout';
import API from '../API';


function TicketLayout(props) {
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [autoCount, setAutoCount] = useState(1);
    const [autoCategory, setAutoCategory] = useState('normal');
    const [errorMessage, setErrorMessage] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        API.getSeats()
            .then(data => setSeats(data))
            .catch(err => setErrorMessage(err.error || 'Error'));
    }, []);

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    const handleSeatClick = (seat) => {
        // già selezionato
        if (selectedSeats.find(s => s.row === seat.row && s.number === seat.number)) {
            setSelectedSeats(selectedSeats.filter(s => !(s.row === seat.row && s.number === seat.number)));
        } else {
            // aggiungo se non è pieno
            setSelectedSeats([...selectedSeats, { row: seat.row, number: seat.number }])
        }
    };

    const handleBooking = (type) => {
        setErrorMessage('');

        if (type === "manual" && selectedSeats.length === 0) {
            setErrorMessage("Please select at least one seat for manual booking");
            return;
        }

        API.createReservation(type, selectedSeats, autoCount, autoCategory)
            .then(() => {
                props.setMessage({ text: "Reservation created successfully!", type: "success" })
                navigate('/reservations')
            })
            .catch((err) => setErrorMessage(err.error))
    };

    return (
        <Row>
            <Col md={12}>
                <h2 className="mb-3">New Reservation</h2>
                {errorMessage && <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>{errorMessage}</Alert>}

                <Tabs defaultActiveKey="manual" className="mb-4">
                    <Tab eventKey="manual" title="Manual Selection">
                        <Card className="p-3 shadow-sm mb-4">
                            <TheaterMap seats={seats} selectable={true} selectedSeats={selectedSeats} onSeatClick={handleSeatClick} onConfirm={() => handleBooking('manual')} />
                        </Card>
                    </Tab>

                    <Tab eventKey="automatic" title="Automatic Assignment">
                        <Card className="p-4 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
                            <Form onSubmit={(e) => e.preventDefault()}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Number of Seats</Form.Label>
                                    <Form.Control type="number" min="1" value={autoCount} onChange={(e) => setAutoCount(parseInt(e.target.value))} />
                                </Form.Group>
                                <Form.Group className="mb-4">
                                    <Form.Label>Category</Form.Label>
                                    <Form.Select value={autoCategory} onChange={(e) => setAutoCategory(e.target.value)}>
                                        <option value="normal">Normal</option>
                                        <option value="premium">Premium</option>
                                    </Form.Select>
                                </Form.Group>
                                <div className="d-grid">
                                    <Button variant="primary" size="lg" onClick={() => handleBooking('automatic')}>
                                        Assign & Reserve
                                    </Button>
                                </div>
                            </Form>
                        </Card>
                    </Tab>
                </Tabs>
            </Col>
        </Row>
    );
}

export { TicketLayout };