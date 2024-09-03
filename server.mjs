import express from 'express';
import initAPIRoute from './route/api.js';

const app = express();
const port = 4000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}/`);
});

initAPIRoute(app);
