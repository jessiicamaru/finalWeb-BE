import express from 'express';
import { getAllTrainSchedule } from '../controller/apiController.js';

let router = express.Router();

const initAPIRoute = (app) => {
    router.get('/:trainid', getAllTrainSchedule);
    router.get('/:stationid', getAllTrainSchedule);

    return app.use('/api/v1/', router);
};

export default initAPIRoute;
