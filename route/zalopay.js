import express from 'express';
import { payment } from '../controller/zalopayController.js';

let router = express.Router();

const initZaloPayRoute = (app) => {
    router.post('/payment', payment);

    return app.use('/api/v2/', router);
};

export default initZaloPayRoute;
