import { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { TheaterMap } from './SeatLayout.jsx';
import API from '../API';


function Reservations(props) {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [selectedRes, setSelectedRes] = useState(null);
    const [seats, setSeats] = useState([]);
    const [tempSeats, setTempSeats] = useState([]);
    const [modalError, setModalError] = useState('');
    const [saving, setSaving] = useState(false);
    const [readOnly, setReadOnly] = useState(false);

    const loadReservations = () => {
        setLoading(true);
        API.getReservations()
            .then(data => setReservations(data))
            .catch(err => setError(err.error || 'Error in loading reservations'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadReservations();
    }, []);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleDelete = (id) => {
        setError('');
        API.deleteReservation(id)
            .then(() => {
                props.setMessage("Reservation deleted! (Remember: you cannot re-book these seats for 40 seconds)");
                loadReservations();
            })
            .catch(err => setError(err.error || "Impossible to delete"));
    };

    const handleOpenModal = (res, isReadOnly = false) => {
        setSelectedRes(res);
        setTempSeats([...res.seats]);
        setModalError('');
        setReadOnly(isReadOnly);

        API.getSeats()
            .then(data => {
                setSeats(data);
                setShowModal(true);
            })
            .catch(err => {
                setModalError(err.error || "Error in loading seats");
            });
    };

    const handleSeatClick = (seat) => {
        const alreadySelected = tempSeats.find(s => s.row === seat.row && s.number === seat.number);

        if (alreadySelected) {
            setTempSeats(tempSeats.filter(s => !(s.row === seat.row && s.number === seat.number)));
        } else {
            setTempSeats([...tempSeats, { row: seat.row, number: seat.number }]);
        }
    }

    const handleSaveEdits = () => {
        if (tempSeats.length === 0) {
            setModalError("You must select at least one seat. If you want to delete the reservation, click on \"Delete\" button outside.");
            return;
        }

        setSaving(true);
        setModalError('');

        const add = tempSeats.filter(t => !selectedRes.seats.find(orig => orig.row === t.row && orig.number === t.number));
        const rem = selectedRes.seats.filter(orig => !tempSeats.find(t => t.row === orig.row && t.number === orig.number));

        API.editReservation(selectedRes.id, add, rem)
            .then(() => {
                props.setMessage("Reservation modified!");
                setShowModal(false);
                loadReservations();
            })
            .catch(err => {
                setModalError(err.error || "Error in editing reservation");
            })
            .finally(() => setSaving(false));
    };

    if (loading && reservations.length === 0)
        return <div className="text-center mt-5"><Spinner animation="border" /></div>;

    return (
        <Row className='px-3'>
            <Col>
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

                {reservations.length === 0 ? (
                    <div className="text-center mt-5">
                        <Alert variant="info">You have not made any reservations yet.</Alert>
                        <Button variant="primary" size="lg" onClick={() => navigate('/booking')} className="mt-3">
                            <i className="bi bi-plus-circle me-1"></i> Book a Ticket
                        </Button>
                    </div>
                ) : (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {reservations.map((res, index) => (
                            <Col key={res.id}>
                                <Card className="h-100 shadow-sm border-0 bg-white rounded-3">
                                    <Card.Body className="d-flex flex-column p-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <Card.Title className="mb-0 fw-bold text-dark fs-5"> Reservation #{(index + 1)}
                                            </Card.Title> {props.user?.isActive && (
                                                <span className="badge bg-secondary">UserID: {res.userId}</span>
                                            )}
                                        </div>
                                        <Card.Subtitle className='mb-3 text-muted small'>
                                            Reserved seats: {res.seats.length}
                                        </Card.Subtitle>
                                        <div className="mb-4 flex-grow-1">
                                            {res.seats.map(s => (
                                                <span key={`${s.row}${s.number}`} className="badge bg-dark me-1 mb-1 px-2 py-1 fs-6">
                                                    {s.row}-{s.number}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="d-flex gap-2 mt-auto">
                                            <Button
                                                variant="outline-secondary"
                                                className='fw-semibold flex-grow-1'
                                                onClick={() => handleOpenModal(res, true)}
                                                title="View on Map"
                                            >
                                                <i className="bi bi-eye"></i> View
                                            </Button>
                                            <Button variant="outline-primary" className='fw-semibold' onClick={() => handleOpenModal(res, false)} title='Modify reservation'>
                                                <i className="bi bi-pencil-square"></i> Edit
                                            </Button>
                                            <Button variant="outline-danger" className='fw-semibold' onClick={() => handleDelete(res.id)} title='Delete reservation'>
                                                <i className="bi bi-trash"></i> Delete
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
                <Modal show={showModal} onHide={() => !saving && setShowModal(false)} fullscreen={true} centered>
                    <Modal.Header closeButton={!saving}>
                        <Modal.Title>{readOnly ? "View" : "Edit"} Reservation #{props.user?.isActive ? selectedRes?.id : (reservations.findIndex(r => r.id === selectedRes?.id) + 1)}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {modalError && <Alert variant='danger' dismissible onClose={() => setModalError('')}>{modalError}</Alert>}
                        <p className="text-muted small mb-3">
                            {readOnly
                                ? "Map in read-only mode. Yellow seats are your reservation."
                                : "Click on yellow seats to release them or on free seats (green/blue) to add them."
                            }</p>

                        <TheaterMap
                            seats={seats}
                            selectable={!readOnly}
                            selectedSeats={tempSeats}
                            onSeatClick={handleSeatClick}
                            editMode={true}
                            originalSeats={selectedRes?.seats}
                        />
                    </Modal.Body>
                    <Modal.Footer className="border-0 px-4 pb-4">
                        <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
                            Close
                        </Button>
                        {!readOnly && <Button variant="success" onClick={handleSaveEdits} disabled={saving} className="fw-semibold">
                            {saving ? <Spinner animation="border" size="sm" /> : 'Save Changes'}
                        </Button>}
                    </Modal.Footer>
                </Modal>
            </Col>
        </Row>
    );
}

export { Reservations };