import express from 'express';
import { getAllTrainSchedule, getData } from '../controller/apiController.js';

let router = express.Router();

const initAPIRoute = (app) => {
    router.get('/search/:trainid', getAllTrainSchedule);
    router.get('/search/:stationid', getAllTrainSchedule);
    router.post('/senddata', getData);

    return app.use('/api/v1/', router);
};

export default initAPIRoute;
