import express from 'express';
import initAPIRoute from './route/api.js';
import initZaloPayRoute from './route/zalopay.js';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

const app = express();
const port = 4000;

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

initAPIRoute(app);
initZaloPayRoute(app);
