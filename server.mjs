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
    // Xóa trong bảng BookedTicket và lưu các TicketID bị xóa
    const [rows] = await pool.execute(`
        SELECT ID 
        FROM BookedTicket 
        WHERE bookingdate < DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
    `);

    const ticketIds = rows.map((row) => row.ID);

    if (ticketIds.length > 0) {
        // Xóa các vé trong bảng orders
        const placeholders = ticketIds.map(() => '?').join(', ');
        await pool.execute(`DELETE FROM orders WHERE TicketID IN (${placeholders})`, ticketIds);

        // Xóa các vé trong bảng BookedTicket
        await pool.execute(`DELETE FROM BookedTicket WHERE ID IN (${placeholders})`, ticketIds);
    }
}

initTrainRoute(app);
initZaloPayRoute(app);
initUserRoute(app);
