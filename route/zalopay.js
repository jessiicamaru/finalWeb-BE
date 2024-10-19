import express from 'express';
import { payment, callback, checkOrderStatus } from '../controller/zalopayController.js';

let router = express.Router();

const initZaloPayRoute = (app) => {
    router.post('/payment', payment);
    router.post('/callback', callback);
    router.post('/check-order-status', checkOrderStatus);

    return app.use('/api/v2/zalopay/', router);
};

export default initZaloPayRoute;
