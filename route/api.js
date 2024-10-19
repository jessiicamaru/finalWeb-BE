import express from 'express';
import {
    getAllTrainSchedule,
    getData,
    searchUnavailableSeatbyCoach,
    searchUnavailableCoachByTrain,
    clearCookie,
} from '../controller/apiController.js';

let router = express.Router();

const initAPIRoute = (app) => {
    router.get('/search/:trainid', getAllTrainSchedule);
    router.get('/search/:stationid', getAllTrainSchedule);
    router.post('/senddata', getData);
    router.get('/searchUnavailableSeatbyCoach', searchUnavailableSeatbyCoach);
    router.get('/searchUnavailableCoachByTrain', searchUnavailableCoachByTrain);
    router.post('/clearCookie', clearCookie);

    return app.use('/api/v1/', router);
};

export default initAPIRoute;
