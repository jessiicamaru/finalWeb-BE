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
         JOIN Station AS NewDepart ON NewDepart.StationID = '${depart}'
         JOIN Station AS NewArrive ON NewArrive.StationID = '${arrive}'
         WHERE Coach = ${coach}
         AND DATE(BookingDate) = '${date}'
         AND TrainID = '${trainid}'
         AND (
             (Depart.StationOrder >= NewDepart.StationOrder AND Arrive.StationOrder <= NewArrive.StationOrder)
             OR
             (Depart.StationOrder >= NewDepart.StationOrder AND Depart.StationOrder <= NewArrive.StationOrder)
             OR
             (Arrive.StationOrder >= NewDepart.StationOrder AND Arrive.StationOrder <= NewArrive.StationOrder)
              OR
             (NewDepart.StationOrder >= Depart.StationOrder AND NewArrive.StationOrder >= Arrive.StationOrder)
         );`
    );

    return res.status(200).json({
        message: 'ok',
        data: rows,
    });
};

const searchUnavailableCoachByTrain = async (req, res) => {
    const { trainid, date, depart, arrive } = req.query;

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
        JOIN Station AS NewDepart ON NewDepart.StationID = '${depart}'
        JOIN Station AS NewArrive ON NewArrive.StationID = '${arrive}'
        WHERE bookedticket.TrainID = '${trainid}'
        AND DATE(bookedticket.BookingDate) = '${date}'
        AND (
            (Depart.StationOrder >= NewDepart.StationOrder AND Arrive.StationOrder <= NewArrive.StationOrder)
            OR
            (Depart.StationOrder <= NewDepart.StationOrder AND Arrive.StationOrder >= NewDepart.StationOrder)
            OR
            (Depart.StationOrder >= NewDepart.StationOrder AND Arrive.StationOrder <= NewArrive.StationOrder)
            OR
            (NewDepart.StationOrder >= Depart.StationOrder AND NewArrive.StationOrder >= Arrive.StationOrder)
        )
        GROUP BY bookedticket.Coach;
    `
    );

    // Xử lý và kiểm tra các toa bị đầy
    const unavailableCoaches = bookedSeats.filter((seat) => seat.bookedSeats >= 64);

    return res.status(200).json({
        message: 'ok',
        data: unavailableCoaches,
    });
};

const getBookedTicketId = async (req, res) => {
    const { name, email, id, phone, bookingDate } = req.body.data;
    const [rows, fields] = await pool.execute(
        `SELECT ID FROM bookedticket WHERE cus_name = '${name}' AND cus_email = '${email}' AND bookingDate = '${bookingDate}' AND cus_id = '${id}' AND cus_phone = '${phone}'`
    );
    const ids = rows.map((row) => row.ID);
    const code = ids.join(';');

    console.log(ids); // In danh sách các ID
    return res.status(200).json({
        code,
    });
};

const getTicket = async (req, res) => {
    const { phone, email, bookingCode } = req.body.data;
    const [rows, fields] = await pool.execute(
        `SELECT * FROM bookedticket WHERE AND cus_email = '${email}' AND cus_phone = '${phone}' AND ID = '${bookingCode}'`
    );
    const ids = rows.map((row) => row.ID);
    const code = ids.join(';');

    console.log(ids); // In danh sách các ID
    return res.status(200).json({
        code,
    });
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

export { getAllTrainSchedule, getData, searchUnavailableSeatbyCoach, searchUnavailableCoachByTrain, clearCookie, getBookedTicketId };
