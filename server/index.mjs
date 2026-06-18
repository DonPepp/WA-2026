import express from 'express';
import morgan from 'morgan';
import { check, param, validationResult } from 'express-validator';
import dayjs from 'dayjs';
import cors from 'cors';

import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { TOTP } from 'otpauth';

import userDao from './dao-users.mjs';
import seatDao from './dao-seats.mjs';

const app = express();

app.use(morgan('dev'));
app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUser(username, password)
  if (!user)
    return callback(null, false, 'Incorrect username or password');

  return callback(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser, i.e, id, username, name)
}));


passport.serializeUser(function (user, callback) {
  callback(null, user);
});

passport.deserializeUser(function (user, callback) {
  return callback(null, user);
});

app.use(session({
  secret: 'theater-secret-key-Giuseppe',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.authenticate('session'));


function verifyTotpToken(user, token) {
  const totp = new TOTP({
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: user.secret
  });

  const delta = totp.validate({ token, window: 1 });
  if (delta === null)
    return false;

  const currentCounter = totp.counter();
  const actualStep = currentCounter + delta;

  if (actualStep <= user.lastTotpStep)
    return false;

  user.lastTotpStep = actualStep;
  return true;
}

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
}


const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${location}[${param}]: ${msg}`;
};

function clientUserInfo(req) {
  const user = req.user;
  const isAdmin = user.is_admin === 1 && req.session.method === 'totp';
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    is_admin: user.is_admin,
    isActive: isAdmin
  };
};

// se un admin non fa il TOTP, si comporta come user normale
const getEffectiveUser = (req) => {
  const user = req.user;
  if (user.is_admin && req.session.method === 'totp')
    return user;  // è un vero admin
  return { ...user, is_admin: 0 }; //user normale (is_admin = 0)
};

app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json({ error: info });
    }
    // success, perform the login and extablish a login session
    req.login(user, (err) => {
      if (err)
        return next(err);

      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser() in LocalStratecy Verify Fn
      return res.json(clientUserInfo(req));
    });
  })(req, res, next);
});

app.post('/api/login-totp', isLoggedIn,

  async (req, res) => {
    //console.log('DEBUG: TOTP login attempt for user '+JSON.stringify(req.user));
    if (!req.user.secret) {
      console.log('TOTP not enabled for this user');
      return res.status(400).json({ error: 'Cannot authenticate with TOTP' });
    }
    const success = verifyTotpToken(req.user, req.body.code);
    if (success) {
      req.session.method = 'totp';
      // STORE lastTotpStep in DB for replay protection
      try {
        //console.log('DEBUG: Updating lastTotpStep to '+req.user.lastTotpStep);
        await userDao.updateLastTotpStep(req.user.id, req.user.lastTotpStep);
      } catch (err) {
        console.log(err);
        return res.status(503).json({ error: 'Database error' });
      }
      return res.json({ otp: 'authorized' });
    } else {
      console.log('Invalid or replayed TOTP code');
      return res.status(401).json({ error: 'Cannot authenticate with TOTP' });
    }
  }
);

app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(clientUserInfo(req));
  }
  else
    res.status(401).json({ error: 'Not authenticated' });
});

// DELETE /api/session/current
// This route is used for loggin out the current user.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});

// per visualizzare i posti
app.get('/api/seats', async (req, res) => {
  try {
    const seats = await seatDao.getSeats();
    res.json(seats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// per visualizzare le reservation di un utente
app.get('/api/reservations', isLoggedIn, async (req, res) => {
  try {
    const user = getEffectiveUser(req);
    let reservations;
    if (user.is_admin === 1) {
      reservations = await seatDao.getAllReservations();
    } else {
      reservations = await seatDao.getReservationsByUserId(user.id);
    }
    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// per creare una reservation 
app.post('/api/reservations', isLoggedIn,
  [
    check('type').isIn(['manual', 'automatic']).withMessage('Invalid reservation type'),
    check('seats').optional().isArray().withMessage('Seats must be an array'),
    check('count').optional().isInt({ min: 1 }).withMessage('Count must be a positive integer'),
    check('category').optional().isIn(['normal', 'premium']).withMessage('Invalid seat category'),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
    try {
      const user = req.user;
      const { type, seats, count, category } = req.body;
      const isAdmin = req.user.is_admin === 1 && req.session.method === 'totp';
      const all = await seatDao.getSeats();
      let taken = [];
      const timestamp = dayjs().subtract(40, 'seconds').toISOString();


      if (type === 'manual') {
        taken = seats;
      } else if (type === 'automatic') {
        const free = all.filter(s => s.status === 'free' && s.category === category);
        const blockStatus = isAdmin
          ? free.map(() => false)
          : await Promise.all(free.map(s => seatDao.isReleased(user.id, s.row, s.number, timestamp)));
        const freeNotBlocked = free.filter((s, id) => !blockStatus[id]);


        if (freeNotBlocked.length < count) {
          return res.status(422).json({ error: 'Not enough free seats' });
        }

        // vediamo se c'è una riga che li contiene tutti
        const seatsByRow = {};
        freeNotBlocked.forEach(s => {
          if (!seatsByRow[s.row])
            seatsByRow[s.row] = [];
          seatsByRow[s.row].push(s);
        });

        let selected = null;
        for (const row in seatsByRow) {
          if (seatsByRow[row].length >= count) {
            selected = row;
            break;
          }
        }

        if (selected) {
          // tutti sulla stessa riga
          taken = seatsByRow[selected].slice(0, count).map(s => ({
            row: s.row,
            number: s.number
          }));
        } else {
          // li prendiamo sparsi
          taken = freeNotBlocked.slice(0, count).map(s => ({
            row: s.row,
            number: s.number
          }));
        }
      }
      else {
        return res.status(422).json({ error: 'Invalid type' });
      }

      for (const seat of taken) {
        const state = all.find(s => s.row === seat.row && s.number === seat.number);
        if (!state || state.status !== 'free') {
          return res.status(422).json({ error: `Seat ${seat.row}-${seat.number} is not free` });
        }
        const isBlocked = !isAdmin && await seatDao.isReleased(user.id, seat.row, seat.number, timestamp);
        if (isBlocked)
          return res.status(422).json({ error: `You have released seat ${seat.row}-${seat.number} less than 40 seconds ago. Please wait.` });
      }

      const reservationId = await seatDao.createReservation(user.id);

      for (const seat of taken) {
        await seatDao.reserveSeat(reservationId, seat.row, seat.number, user.id);
      }

      return res.status(200).json({ message: "Reservation done", reservationId, seats: taken });

    }
    catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
  });

// per eliminare una reservation
app.delete('/api/reservations/:id', isLoggedIn,
  [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
    try {
      const reservationId = parseInt(req.params.id);
      const user = getEffectiveUser(req);
      const now = dayjs().toISOString();

      const ownerId = await seatDao.getReservationOwner(reservationId);
      if (!ownerId)
        return res.status(404).json({ error: 'Reservation not found' });

      if (user.is_admin !== 1 && user.id !== ownerId)
        return res.status(403).json({ error: 'You cannot delete this reservation' });

      const allReservations = await seatDao.getReservationsByUserId(ownerId);
      const reservation = allReservations.find(r => r.id === reservationId);


      for (const seat of reservation.seats) {
        await seatDao.removeSeatFromReservation(reservationId, seat.row, seat.number);
        await seatDao.addReleasedSeat(reservation.userId, seat.row, seat.number, now);
      }

      await seatDao.deleteReservation(reservationId);
      return res.status(200).json({ message: 'Reservation cancelled' });
    }
    catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
  });

// per modificare una reservation 
app.put('/api/reservations/:id', isLoggedIn,
  [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
    check('add').optional().isArray().withMessage('Add must be an array of seats'),
    check('rem').optional().isArray().withMessage('Remove must be an array of seats')
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
    try {
      const reservationId = parseInt(req.params.id);
      const { add, rem } = req.body;
      const user = getEffectiveUser(req);
      const now = dayjs().toISOString();
      const timestamp = dayjs().subtract(40, 'seconds').toISOString();
      const isAdmin = req.user.is_admin === 1 && req.session.method === 'totp';

      const ownerId = await seatDao.getReservationOwner(reservationId);
      if (!ownerId)
        return res.status(404).json({ error: 'Reservation not found' });

      if (user.is_admin !== 1 && user.id !== ownerId)
        return res.status(403).json({ error: 'You cannot modify this reservation' });

      const allReservations = await seatDao.getReservationsByUserId(ownerId);
      const reservation = allReservations.find(r => r.id === reservationId);


      const all = await seatDao.getSeats();

      if (rem && rem.length > 0) {
        for (const seat of rem) {
          await seatDao.removeSeatFromReservation(reservationId, seat.row, seat.number);
          await seatDao.addReleasedSeat(reservation.userId, seat.row, seat.number, now);
        }
      }

      if (add && add.length > 0) {
        for (const seat of add) {
          const seatState = all.find(s => s.row === seat.row && s.number === seat.number);
          if (!seatState || seatState.status !== 'free') {
            return res.status(422).json({ error: `Seat ${seat.row}-${seat.number} is not free` });
          }
          const isBlocked = !isAdmin && await seatDao.isReleased(ownerId, seat.row, seat.number, timestamp);
          if (isBlocked)
            return res.status(422).json({ error: `You have released seat ${seat.row}-${seat.number} less than 40 seconds ago. Please wait.` });
          await seatDao.reserveSeat(reservationId, seat.row, seat.number, ownerId);
        }
      }
      res.status(200).json({ message: 'Reservation updated' })
    }
    catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  });



const PORT = 3001;
// Activate the server
app.listen(PORT, (err) => {
  if (err)
    console.log(err);
  else
    console.log(`Server listening at http://localhost:${PORT}`);
}); 