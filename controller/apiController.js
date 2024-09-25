import pool from '../config/connectDB.js';
import 'dotenv/config';

import { tokenGenerator } from '../utils/tokenConverter.js';

const stationIndex = ['HN', 'ND', 'TH', 'VIN', 'DH', 'HUE', 'DN', 'QNG', 'QNO', 'NT', 'PT', 'BT', 'SG'];

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
        maxAge: 15 * 1000,
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
                const [rows1, fields1] = await pool.execute(`SELECT * FROM se${i}schedule WHERE StationID = '${fromStation}'`);
                const [rows2, fields2] = await pool.execute(`SELECT * FROM se${i}schedule WHERE StationID = '${toStation}'`);

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

                for (let i = start; i <= end; i++) {
                    const [rows1, fields1] = await pool.execute(
                        `SELECT * FROM se${i}schedule WHERE StationID = '${i == 0 ? fromStation : toStation}'`
                    );
                    const [rows2, fields2] = await pool.execute(
                        `SELECT * FROM se${i}schedule WHERE StationID = '${i == 0 ? toStation : fromStation}'`
                    );

                    if (rows1 && rows2) {
                        data.list.push({
                            trainid: `SE${i}`,
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
    //http://localhost:4000/api/v1/searchUnavailableSeatbyCoach?trainid=SE8&coach=2&date=2024-12-16&depart=DN&arrive=DH
    const { trainid, coach, date, depart, arrive } = req.query;

    if (!req.cookies['u_t']) {
        return res.status(401).json({
            message: 'Token has expired',
        });
    }

    const data = [];

    if (!trainid || !coach || !date || !depart || !arrive) {
        return res.status(400).json({
            message: 'error! Enter query',
        });
    }

    const [rows, fields] = await pool.execute(
        `SELECT Position FROM bookedticket WHERE Coach = ${coach} AND DATE(BookingDate) = '${date}' AND DepartStation = '${depart}' AND ArriveStation = '${arrive}' AND TrainID = '${trainid}'`
    );

    //`SELECT * FROM ${trainid}schedule WHERE Coach = '${coach}' AND DATE(BookingDate) = '${date}' AND DepartStation = '${depart}' AND ArriveStation = '${arrive}'`

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

    const [rows, fields] = await pool.execute(
        `SELECT Coach FROM unavailablecoach WHERE DATE(BookingDate) = '${date}' AND DepartStation = '${depart}' AND ArriveStation = '${arrive}' AND TrainID = '${trainid}'`
    );

    return res.status(200).json({
        message: 'ok',
        data: rows,
    });
};

export { getAllTrainSchedule, getData, searchUnavailableSeatbyCoach, searchUnavailableCoachByTrain };
