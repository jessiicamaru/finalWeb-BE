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
    const { uid, password } = req.body;

    const [rows, fields] = await pool.execute('UPDATE users SET Password = ? WHERE UID = ?', [password, uid]);

    return res.status(200).json({
        message: 'ok',
        data: rows[0],
    });
};

export { addUser, getUser, updateUser };
