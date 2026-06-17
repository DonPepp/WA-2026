import db from './db.mjs';

// ritorna i posti del teatro
// per la mappa
const getSeats = () => {
    return new Promise((resolve, reject) => {
        const sqlReserved = `
            SELECT s.row_label, s.seatNumber, s.category, sr.userId, sr.reservationId 
            FROM seats s
            LEFT JOIN seatsReserved sr ON s.row_label = sr.row_label AND s.seatNumber = sr.seatNumber
        `;
        db.all(sqlReserved, [], (err, rows) => {
            if (err) return reject(err);
            else {
                const seats = rows.map(r => ({
                    row: r.row_label,
                    number: r.seatNumber,
                    category: r.category,
                    status: r.reservationId ? 'reserved' : 'free'
                }));
                resolve(seats);
            }
        });
    });
};

// prende tutte le reservation (per admin), 
// prende solo quelle associate ad un user
const getReservations = (user) => {
    return new Promise((resolve, reject) => {
        let sql = `
            SELECT r.id, r.userId AS ownerId, sr.row_label, sr.seatNumber 
            FROM reservations r 
            LEFT JOIN seatsReserved sr ON r.id = sr.reservationId
        `;
        let params = [];
        // se non è admin vede solo le sue
        if (!user || user.is_admin !== 1) {
            sql += " WHERE r.userId = ?";
            params.push(user ? user.id : null);
        }
        db.all(sql, params, (err, row) => {
            if (err) reject(err);
            else {
                const reservations = {};
                row.forEach(r => {
                    if (!reservations[r.id]) {
                        reservations[r.id] = {
                            id: r.id,
                            userId: r.ownerId,
                            seats: []
                        };
                    }
                    if (r.row_label && r.seatNumber) {
                        reservations[r.id].seats.push({
                            row: r.row_label,
                            number: r.seatNumber
                        });
                    }
                });
                resolve(Object.values(reservations));
            }
        });
    });
};

// controlla se un posto è stato appena rilasciato
const isReleased = (userId, row_label, seat_number, timestamp) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT *
            FROM seatsReleased
            WHERE userId = ? AND row_label = ? AND seatNumber = ? AND dateDelete > ?
        `;
        const params = [userId, row_label, seat_number, timestamp];
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            // true only if seat is released recently 
            else resolve(row !== undefined);
        })
    })
};

// crea solo la reservation e ritorna l'id della reservation
const createReservation = (userId) => {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO reservations (userId) VALUES (?)", [userId], function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

// aggiunge un posto alla reservation
const reserveSeat = (reservationId, row_label, seat_number, user) => {
    return new Promise((resolve, reject) => {
        // troviamo prima il proprietario della prenotazione
        const proprietary = 'SELECT userId FROM reservations WHERE id = ?';
        db.get(proprietary, [reservationId], (err, row) => {
            if (err) reject(err);
            if (!row) return resolve(0); //se non c'è la prenotazione ritorna 0

            const ownerId = row.userId;

            if (user.is_admin !== 1 && user.id !== ownerId) {
                return resolve(0); // non è admin e non è il proprietario, non può riservare questo posto
            }
            const sql = 'INSERT INTO seatsReserved (reservationId, row_label, seatNumber, userId) VALUES (?, ?, ?, ?)';
            db.run(sql, [reservationId, row_label, seat_number, ownerId], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        })
    });
};

// rimuove un posto dalla reservation
const removeSeatFromReservation = (reservationId, row_label, seat_number, user) => {
    return new Promise((resolve, reject) => {
        let sql;
        let params;

        if (user.is_admin === 1) {
            sql = 'DELETE FROM seatsReserved WHERE reservationId = ? AND row_label = ? AND seatNumber = ?';
            params = [reservationId, row_label, seat_number];
        } else {
            sql = 'DELETE FROM seatsReserved WHERE reservationId = ? AND row_label = ? AND seatNumber = ? AND userId = ?';
            params = [reservationId, row_label, seat_number, user.id];
        }

        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
};

// aggiunge nello storico un posto appena rilasciato
// usato per la regola dei 40 secondi 
// un posto non può esser riassegnato entro 40 secondi dal rilascio
const addReleasedSeat = (userId, row_label, seat_number, timestamp) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO seatsReleased (userId, row_label, seatNumber, dateDelete) VALUES (?, ?, ?, ?)';
        db.run(sql, [userId, row_label, seat_number, timestamp], function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};


const deleteReservation = (reservationId, user) => {
    return new Promise((resolve, reject) => {
        let sql;
        let params;

        if (user.is_admin === 1) {
            sql = 'DELETE FROM reservations WHERE id = ? ';
            params = [reservationId];
        } else {
            sql = 'DELETE FROM reservations WHERE id = ? AND userId = ? ';
            params = [reservationId, user.id];
        }
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
};


export default { getSeats, getReservations, isReleased, createReservation, reserveSeat, removeSeatFromReservation, addReleasedSeat, deleteReservation };
