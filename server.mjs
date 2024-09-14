import express from 'express';
import initAPIRoute from './route/api.js';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const port = 4000;

const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}/`);
});

initAPIRoute(app);
