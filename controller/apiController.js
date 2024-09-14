import pool from '../config/connectDB.js';

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
                data: data,
            });
        }
        case 2: {
            const dataList = [];

            let flag = true;

            for (let i = 0; i <= 1; i++) {
                let data = {
                    date,
                    way,
                    list: [],
                    toStation: flag ? toStation : fromStation,
                    fromStation: flag ? fromStation : toStation,
                };
                flag = !flag;
                let start = flag ? 8 : 1;
                let end = flag ? 14 : 7;

                for (let i = start; i <= end; i++) {
                    const [rows1, fields1] = await pool.execute(`SELECT * FROM se${i}schedule WHERE StationID = '${flag ? toStation : fromStation}'`);
                    const [rows2, fields2] = await pool.execute(`SELECT * FROM se${i}schedule WHERE StationID = '${flag ? fromStation : toStation}'`);

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

export { getAllTrainSchedule, getData };
