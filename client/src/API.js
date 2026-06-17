const SERVER_URL = 'http://localhost:3001/api/';

function getJson(httpResponsePromise) {
  // server API always return JSON, in case of error the format is the following { error: <message> } 
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {

          // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
          response.json()
            .then(json => resolve(json))
            .catch(err => reject({ error: "Cannot parse server response" }))

        } else {
          // analyzing the cause of error
          response.json()
            .then(obj =>
              reject(obj)
            ) // error msg in the response body
            .catch(err => reject({ error: "Cannot parse server response" })) // something else
        }
      })
      .catch(err =>
        reject({ error: "Cannot communicate" })
      ) // connection error
  });
}

const getSeats = async () => {
  return getJson(
    fetch(SERVER_URL + 'seats')
  );
};

const getReservations = async () => {
  return getJson(
    fetch(SERVER_URL + 'reservations', {
      credentials: 'include'
    })
  );
};

const createReservation = async (type, seats, count, category) => {
  return getJson(fetch(SERVER_URL + 'reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ type, seats, count, category }),
  }));
};

const editReservation = async (id, add, rem) => {
  return getJson(
    fetch(SERVER_URL + 'reservations/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ add, rem }),
    })
  );
};

const deleteReservation = async (id) => {
  return getJson(
    fetch(SERVER_URL + 'reservations/' + id, {
      method: 'DELETE',
      credentials: 'include',
    })
  );
};


const logIn = async (credentials) => {
  return getJson(fetch(SERVER_URL + 'sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // this parameter specifies that authentication cookie must be forwarded
    body: JSON.stringify(credentials),
  })
  )
};


const totpVerify = async (totpCode) => {
  return getJson(fetch(SERVER_URL + 'login-totp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // this parameter specifies that authentication cookie must be forwarded
    body: JSON.stringify({ code: totpCode }),
  })
  )
};

const getUserInfo = async () => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    // this parameter specifies that authentication cookie must be forwarded
    credentials: 'include'
  })
  )
};

const logOut = async () => {
  return getJson(fetch(SERVER_URL + 'sessions/current', {
    method: 'DELETE',
    credentials: 'include'  // this parameter specifies that authentication cookie must be forwarded
  })
  )
}


const API = {
  getSeats, getReservations, createReservation, editReservation, deleteReservation,
  logIn, totpVerify, getUserInfo, logOut
};

export default API;