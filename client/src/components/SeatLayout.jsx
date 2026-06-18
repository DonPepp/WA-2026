import { Button, Row, Col } from 'react-bootstrap';

function TheaterMap(props) {
    const { seats, selectable, selectedSeats, onSeatClick, editMode, originalSeats } = props;

    const rows = [...new Set(seats.map(s => s.row))].sort();

    const totalSeats = seats.length;
    const reservedSeats = seats.filter(s => s.status === 'reserved').length;
    const freeNormal = seats.filter(s => s.status === 'free' && s.category === 'normal').length;
    const freePremium = seats.filter(s => s.status === 'free' && s.category === 'premium').length;

    return (
        <div className="mt-2">

            <Row className="gy-4">
                <Col lg={9}>
                    <div className="mb-4 text-center p-2 bg-dark text-white rounded w-50 mx-auto fw-semibold" style={{ letterSpacing: '2px' }}>
                        STAGE
                    </div>
                    <div className="d-flex flex-column align-items-center">
                        {rows.map(rowLabel => {
                            const seatsInRow = seats.filter(s => s.row === rowLabel).sort((a, b) => a.number - b.number);
                            return (
                                <Row key={rowLabel} className="mb-1 flex-nowrap justify-content-center">
                                    {seatsInRow.map(seat => {
                                        const isReserved = seat.status === 'reserved';
                                        const isPremium = seat.category === 'premium';
                                        const isSelected = selectedSeats && selectedSeats.find(s => s.row === seat.row && s.number === seat.number);
                                        const isOriginal = editMode && originalSeats && originalSeats.find(s => s.row === seat.row && s.number === seat.number);

                                        const btnStyle = {
                                            width: '42px',
                                            height: '36px',
                                            fontSize: '0.8rem',
                                            padding: '0',
                                            border: 'none',
                                            color: '#000000',
                                            backgroundColor: '#198754',
                                            opacity: '0.85'
                                        };
                                        if (isPremium) {
                                            btnStyle.backgroundColor = '#0dcaf0';
                                        }
                                        if (isReserved && !isOriginal) {
                                            btnStyle.backgroundColor = '#dc3545';
                                        }
                                        if (isSelected) {
                                            btnStyle.backgroundColor = '#ffc107';
                                        }
                                        return (
                                            <Col xs="auto" key={`${seat.row}${seat.number}`} className="p-1">
                                                <Button
                                                    className="btn m-1"
                                                    style={btnStyle}
                                                    onClick={() => selectable && onSeatClick(seat)}
                                                    disabled={!selectable || (isReserved && !isOriginal)}
                                                >
                                                    {seat.row}-{seat.number}
                                                </Button>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            );
                        })}
                    </div>
                </Col>

                <Col lg={3} className="border-start ps-4">
                    <h5 className="mb-3 text-secondary text-uppercase fs-6 fw-bold">Legend</h5>
                    <div className="d-flex flex-column gap-2 mb-4">
                        <div className="d-flex align-items-center gap-2">
                            <span className="d-inline-block rounded" style={{ width: '16px', height: '16px', backgroundColor: '#198754' }}></span>
                            <span className="text-muted small fw-medium">Normal</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="d-inline-block rounded" style={{ width: '16px', height: '16px', backgroundColor: '#0dcaf0' }}></span>
                            <span className="text-muted small fw-medium">Premium </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="d-inline-block rounded" style={{ width: '16px', height: '16px', backgroundColor: '#dc3545' }}></span>
                            <span className="text-muted small fw-medium">Occupied</span>
                        </div>
                        {(selectable || (selectedSeats && selectedSeats.length > 0)) && (
                            <div className="d-flex align-items-center gap-2">
                                <span className="d-inline-block rounded bg-warning" style={{ width: '16px', height: '16px' }}></span>
                                <span className="text-muted small fw-medium">Selected</span>
                            </div>
                        )}
                    </div>
                    {selectable && selectedSeats && selectedSeats.length > 0 && (
                        <>
                            <h5> Your Selection</h5>
                            <div className="d-flex flex-column" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                {selectedSeats.map(seat => (
                                    <div key={`${seat.row}${seat.number}`} className="d-flex justify-content-between align-items-center bg-white p-2 rounded border">
                                        <span className="fw-semibold text-dark small">
                                            {seat.row}-{seat.number}
                                        </span>
                                        <Button
                                            variant="link"
                                            className="p-0 text-danger d-flex align-items-center"
                                            onClick={() => onSeatClick(seat)}
                                            title="Remove seat"
                                        >
                                            <i className="bi bi-trash fs-6"></i>
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="d-flex justify-content-between align-items-center bg-white p-2 rounded">
                                <span>Total Selected:</span>
                                <strong>
                                    {selectedSeats.length}
                                </strong>
                            </div>

                            {props.onConfirm && (
                                <Button variant="success" size='md' onClick={props.onConfirm}>
                                    Confirm Selection
                                </Button>
                            )}
                        </>
                    )}

                    {!selectable && (
                        <>
                            <h5 className="mb-3 text-secondary text-uppercase fs-6 fw-bold mt-4">Theater Info</h5>
                            <div className="bg-light p-3 rounded shadow-sm">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small">Total Seats:</span>
                                    <span className="fw-semibold small">{totalSeats}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small">Occupied Seats:</span>
                                    <span className="fw-semibold small">{reservedSeats}</span>
                                </div>
                                <hr className="my-2" />
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small">Free Normal:</span>
                                    <span className="fw-semibold small text-success">{freeNormal}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted small">Free Premium:</span>
                                    <span className="fw-semibold small text-info">{freePremium}</span>
                                </div>
                            </div>
                        </>
                    )}
                </Col>
            </Row>
        </div >
    );
}

export { TheaterMap }