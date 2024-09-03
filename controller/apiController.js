import pool from '../config/connectDB.js';

let getAllTrainSchedule = async (req, res) => {
    const trainId = req.params.trainid.split('=')[1];

    const [rows, fields] = await pool.execute(`SELECT * FROM ${trainId}schedule`);

    return res.status(200).json({
        message: 'ok',
        data: rows,
    });
};

export { getAllTrainSchedule };
