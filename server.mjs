import express from 'express';
import initTrainRoute from './route/trainApi.js';
import initZaloPayRoute from './route/zalopayApi.js';
import initUserRoute from './route/userApi.js';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import pool from './config/connectDB.js';
const app = express();
const port = 4000;

const flag = true;

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
    optionSuccessStatus: 200,
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}/`);
});

if (flag) {
    pool.execute(`DELETE FROM BookedTicket WHERE bookingdate < CURDATE()`);
    pool.execute(`DELETE FROM BookedTicket WHERE bookingdate < CURDATE()`);
}

initTrainRoute(app);
initZaloPayRoute(app);
initUserRoute(app);
