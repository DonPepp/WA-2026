import db from './db.mjs';
import crypto from 'crypto';

const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE userId = ?';
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (row === undefined) resolve({ error: 'User not found.' });
      else {
        const user = {
          id: row.userId,
          username: row.email,
          name: row.name,
          secret: row.secret,
          is_admin: row.is_admin,
          lastTotpStep: row.lastTotpStep,
        };
        resolve(user);
      }
    });
  });
};

const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [username], (err, row) => {
      if (err) reject(err);
      else if (row === undefined) resolve(false);
      else {
        const user = {
          id: row.userId,
          username: row.email,
          name: row.name,
          is_admin: row.is_admin,
          secret: row.secret,
          lastTotpStep: row.lastTotpStep
        };

        crypto.scrypt(password, row.salt, 32, (err, hashedPassword) => {
          if (err) reject(err);
          if (!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword))
            resolve(false);
          else
            resolve(user);
        });
      }
    });
  });
};

const updateLastTotpStep = (userId, lastTotpStep) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE users SET lastTotpStep = ? WHERE userId = ?';
    db.run(sql, [lastTotpStep, userId], function (err) {
      if (err) reject(err);
      else if (this.changes !== 1) resolve({ error: 'User not found.' });
      else resolve(this.changes);
    });
  });
};

export default { getUserById, getUser, updateLastTotpStep };