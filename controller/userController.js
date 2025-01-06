import pool from '../config/connectDB.js';
import 'dotenv/config';

const addUser = async (req, res) => {
    //http://localhost:4000/api/v3/add-user

    const { uid, displayName, photoURL, email } = req.body;

    console.log({ uid, displayName, photoURL, email });

    if (!uid || !displayName || !photoURL || !email) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const [rows, fields] = await pool.execute('INSERT IGNORE INTO users (UID, DisplayName, PhotoURL, Email) VALUES (?, ?, ?, ?)', [
        uid,
        displayName,
        photoURL,
        email,
    ]);

    return res.status(200).json({
        message: rows.affectedRows > 0 ? 'Ok' : 'User already exists',
    });
};

const getUser = async (req, res) => {
    //http://localhost:4000/api/v3/get-user/?uid=Xzcnka6u4CVjvSfCqAUCmGQuhst2
    const { uid, email, password } = req.query;

    if (uid) {
        const [rows, fields] = await pool.execute('SELECT * FROM users WHERE UID = ?', [uid]);

        return res.status(200).json({
            message: 'ok',
            data: rows[0],
        });
    }

    if (email && password) {
        const [rows, fields] = await pool.execute('SELECT * FROM users WHERE Email = ? AND Password = ?', [email, password]);

        return res.status(200).json({
            message: 'ok',
            data: rows[0],
        });
    }
};

const updateUser = async (req, res) => {
    const { uid, password, idNumber, phone } = req.body;

    console.log({ uid, password, idNumber, phone });

    if (password) {
        const [rows, fields] = await pool.execute('UPDATE users SET Password = ? WHERE UID = ?', [password, uid]);
        return res.status(200).json({
            message: 'ok',
            data: rows[0],
        });
    }

    if (idNumber && phone) {
        const [rows, fields] = await pool.execute('UPDATE users SET IDNumber = ?, PhoneNumber = ? WHERE UID = ?', [idNumber, phone, uid]);
        return res.status(200).json({
            message: 'ok',
            data: rows[0],
        });
    }
};

const getOrder = async (req, res) => {
    //http://localhost:4000/api/v3/get-order/?uid=Xzcnka6u4CVjvSfCqAUCmGQuhst2
    const { uid } = req.query;

    const [rows, fields] = await pool.execute(
        `SELECT TicketID, cus_email, cus_id, cus_phone, cus_name, sD.StationName 
        AS DepartStation, sA.StationName AS ArriveStation, TrainID, Arrive, Depart, Position, Coach, BookingDate, Price
        FROM orders 
        JOIN bookedticket AS b ON orders.TicketID = b.ID 
        JOIN station AS sD ON b.DepartStation = sD.StationID
        JOIN station AS sA ON b.ArriveStation = sA.StationID
        WHERE UserID = ?`,
        [uid]
    );

    return res.status(200).json({
        message: 'ok',
        data: rows,
    });
};

export { addUser, getUser, updateUser, getOrder };
