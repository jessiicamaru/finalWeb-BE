import express from 'express';
import { getAllTrainSchedule, getData, searchUnavailableSeatbyCoach, searchUnavailableCoachByTrain } from '../controller/apiController.js';

let router = express.Router();

const initAPIRoute = (app) => {
    router.get('/search/:trainid', getAllTrainSchedule);
    router.get('/search/:stationid', getAllTrainSchedule);
    router.post('/senddata', getData);
    router.get('/searchUnavailableSeatbyCoach', searchUnavailableSeatbyCoach);
    router.get('/searchUnavailableCoachByTrain', searchUnavailableCoachByTrain);

    return app.use('/api/v1/', router);
};

export default initAPIRoute;
