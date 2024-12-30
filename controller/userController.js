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

export { addUser };
