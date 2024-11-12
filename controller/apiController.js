import pool from '../config/connectDB.js';
import 'dotenv/config';

import { tokenGenerator } from '../utils/tokenGenerator.js';

const stationIndex = ['HN', 'ND', 'TH', 'VIN', 'DH', 'HUE', 'DN', 'QNG', 'QNO', 'NT', 'PT', 'BT', 'SG'];
const maxAge = 15 * 60 * 1000;

const getAllTrainSchedule = async (req, res) => {
    //http://localhost:4000/api/v1/trainid=se1
    const trainId = req.params.trainid.split('=')[1];

    const [rows, fields] = await pool.execute(`SELECT * FROM ${trainId}schedule`);

    return res.status(200).json({
        message: 'ok',
        data: rows,
    });
};

const getData = async (req, res) => {
    /*
        {
        fromStation: 'DH',
        toStation: 'DN',
        way: 2,
        date: { departure: '2024-09-09', return: '2024-09-20' }
        }
    */

    const { fromStation, toStation, way, date } = req.body.data;
    const ip = req.ip;

    const payload = {
        fromStation,
        toStation,
        way,
        date,
        ip,
    };

    const token = tokenGenerator(payload);
    res.cookie('u_t', token, {
        maxAge,
        httpOnly: true,
        secure: true,
    });

    switch (way) {
        case 1: {
            const data = { date, way, list: [], fromStation, toStation };
            let flag = false;
            if (stationIndex.indexOf(fromStation) > stationIndex.indexOf(toStation)) {
                flag = true;
            }
            let start = flag ? 8 : 1;
            let end = flag ? 14 : 7;

            for (let i = start; i <= end; i++) {
                const [rows1, fields1] = await pool.execute(`SELECT * FROM trainschedule WHERE StationID = '${fromStation}' AND TrainID = 'SE${i}'`);
                const [rows2, fields2] = await pool.execute(`SELECT * FROM trainschedule WHERE StationID = '${toStation}' AND TrainID = 'SE${i}'`);

                if (rows1 && rows2) {
                    data.list.push({
                        trainid: `SE${i}`,
                        scheduleDepart: rows1[0],
                        scheduleArrive: rows2[0],
                    });
                }
            }

            return res.status(200).json({
                message: 'ok',
                data: [data],
            });
        }
        case 2: {
            const dataList = [];

            let flag = false;
            for (let i = 0; i <= 1; i++) {
                let data = {
                    date,
                    way,
                    list: [],
                    toStation: i == 0 ? toStation : fromStation,
                    fromStation: i == 0 ? fromStation : toStation,
                };
                let start = 0;
                let end = 0;

                if (i == 0) {
                    if (stationIndex.indexOf(fromStation) > stationIndex.indexOf(toStation)) {
                        start = 8;
                        end = 14;
                    } else {
                        start = 1;
                        end = 7;
                    }
                } else if (i == 1) {
                    if (stationIndex.indexOf(fromStation) > stationIndex.indexOf(toStation)) {
                        start = 1;
                        end = 7;
                    } else {
                        start = 8;
                        end = 14;
                    }
                }

                for (let j = start; j <= end; j++) {
                    const [rows1, fields1] = await pool.execute(
                        `SELECT * FROM trainschedule WHERE StationID = '${i == 0 ? fromStation : toStation}' AND TrainID = 'SE${j}'`
                    );
                    const [rows2, fields2] = await pool.execute(
                        `SELECT * FROM trainschedule WHERE StationID = '${i == 0 ? toStation : fromStation}' AND TrainID = 'SE${j}'`
                    );

                    if (rows1 && rows2) {
                        data.list.push({
                            trainid: `SE${j}`,
                            scheduleDepart: rows1[0],
                            scheduleArrive: rows2[0],
                        });
                    }
                }

                dataList.push(data);
            }

            return res.status(200).json({
                message: 'ok',
                data: dataList,
            });
        }

        default:
            break;
    }
};

const searchUnavailableSeatbyCoach = async (req, res) => {
    const { trainid, coach, date, depart, arrive } = req.query;

    let flag = stationIndex.indexOf(depart) > stationIndex.indexOf(arrive) ? '>' : '<';

    if (!req.cookies['u_t']) {
        return res.status(401).json({
            message: 'Token has expired',
        });
    }

    if (!trainid || !coach || !date || !depart || !arrive) {
        return res.status(400).json({
            message: 'error! Enter query',
        });
    }

    const [rows, fields] = await pool.execute(
        `SELECT Position 
         FROM bookedticket 
         JOIN Station AS Depart ON bookedticket.DepartStation = Depart.StationID 
         JOIN Station AS Arrive ON bookedticket.ArriveStation = Arrive.StationID
         JOIN Station AS NewDepart ON NewDepart.StationID = ?
         JOIN Station AS NewArrive ON NewArrive.StationID = ?
         WHERE Coach = ?
         AND DATE(BookingDate) = ?
         AND TrainID = ?
         AND (
             (Depart.StationOrder ${flag}= NewDepart.StationOrder AND NewDepart.StationOrder ${flag} Arrive.StationOrder)
             OR 
             (Depart.StationOrder ${flag} NewArrive.StationOrder AND NewArrive.StationOrder ${flag}= Arrive.StationOrder)
             OR 
             (NewDepart.StationOrder ${flag}= Depart.StationOrder AND Arrive.StationOrder ${flag}= NewArrive.StationOrder)
         );`,
        [depart, arrive, coach, date, trainid]
    );

    console.log(`SELECT Position 
         FROM bookedticket 
         JOIN Station AS Depart ON bookedticket.DepartStation = Depart.StationID 
         JOIN Station AS Arrive ON bookedticket.ArriveStation = Arrive.StationID
         JOIN Station AS NewDepart ON NewDepart.StationID = ${depart}
         JOIN Station AS NewArrive ON NewArrive.StationID = ${arrive}
         WHERE Coach = ${coach}
         AND DATE(BookingDate) = ${date}
         AND TrainID = ${trainid}
         AND (
             (Depart.StationOrder ${flag}= NewDepart.StationOrder AND NewDepart.StationOrder ${flag} Arrive.StationOrder)
             OR 
             (Depart.StationOrder ${flag} NewArrive.StationOrder AND NewArrive.StationOrder ${flag}= Arrive.StationOrder)
             OR 
             (NewDepart.StationOrder ${flag}= Depart.StationOrder AND Arrive.StationOrder ${flag}= NewArrive.StationOrder)
         );`);

    return res.status(200).json({
        message: 'ok',
        data: rows,
    });
};

const searchUnavailableCoachByTrain = async (req, res) => {
    const { trainid, date, depart, arrive } = req.query;

    let flag = stationIndex.indexOf(depart) > stationIndex.indexOf(arrive) ? '>' : '<';

    if (!req.cookies['u_t']) {
        return res.status(401).json({
            message: 'Token has expired',
        });
    }

    // Truy vấn các chỗ đã được đặt cho hành trình từ 'depart' tới 'arrive'
    const [bookedSeats, fields] = await pool.execute(
        `
        SELECT bookedticket.Coach, COUNT(bookedticket.Position) as bookedSeats
        FROM bookedticket
        JOIN Station AS Depart ON bookedticket.DepartStation = Depart.StationID
        JOIN Station AS Arrive ON bookedticket.ArriveStation = Arrive.StationID
        JOIN Station AS NewDepart ON NewDepart.StationID = ?
        JOIN Station AS NewArrive ON NewArrive.StationID = ?
        WHERE bookedticket.TrainID = ?
        AND DATE(bookedticket.BookingDate) = ?
        AND (
            (Depart.StationOrder ${flag}= NewDepart.StationOrder AND NewDepart.StationOrder ${flag} Arrive.StationOrder)
             OR 
             (Depart.StationOrder ${flag} NewArrive.StationOrder AND NewArrive.StationOrder ${flag}= Arrive.StationOrder)
              OR 
             (NewDepart.StationOrder ${flag}= Depart.StationOrder AND Arrive.StationOrder ${flag}= NewArrive.StationOrder)
             )
        GROUP BY bookedticket.Coach;
    `,
        [depart, arrive, trainid, date]
    );

    // Xử lý và kiểm tra các toa bị đầy
    const unavailableCoaches = bookedSeats.filter((seat) => seat.bookedSeats >= 64);

    return res.status(200).json({
        message: 'ok',
        data: unavailableCoaches,
    });
};

const getTicket = async (req, res) => {
    const { phone, email, bookingCode } = req.body.data;
    const [rows, fields] = await pool.execute(`SELECT * FROM bookedticket WHERE cus_email = ? AND cus_phone = ? AND ID = ?`, [
        email,
        phone,
        bookingCode,
    ]);
    return res.status(200).json({
        list: rows,
    });
};

const getCode = async (req, res) => {
    const { email } = req.body.data;
    const [rows, fields] = await pool.execute(`SELECT ID FROM bookedticket WHERE cus_email = ? `, [email]);
    const ids = rows.map((row) => row.ID);
    const code = ids.join(';');

    return res.status(200).json({
        status_code: 1,
        code,
    });
};

const returnTicket = async (req, res) => {
    const { phone, email, bookingCode } = req.body.data;
    const [rs] = await pool.execute(`SELECT * FROM paidorder WHERE TicketID = ?`, [bookingCode]);

    const [result] = await pool.execute(`SELECT * FROM bookedticket WHERE cus_email = ? AND cus_phone = ? AND ID = ?`, [email, phone, bookingCode]);

    console.log({ phone, email, bookingCode });

    console.log(result.length);

    if (result.length > 0) {
        return res.status(200).json({
            code: 1,
            data: rs,
            message: 'ok',
        });
    } else {
        return res.status(400).json({
            code: 2,
            message: 'ticket not found',
        });
    }
};

const clearCookie = (req, res) => {
    if (!req.cookies['u_t']) {
        return res.status(200).json({
            message: 'Cookie has been cleared',
            cookie_code: 1,
        });
    }
    res.clearCookie('u_t', { path: '/' });
    return res.status(200).json({
        message: 'Cookie has been cleared',
        cookie_code: 1,
    });
};

export { getAllTrainSchedule, getData, searchUnavailableSeatbyCoach, searchUnavailableCoachByTrain, clearCookie, getTicket, getCode, returnTicket };
