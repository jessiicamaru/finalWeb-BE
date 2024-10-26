import express from 'express';
import {
    getAllTrainSchedule,
    getData,
    searchUnavailableSeatbyCoach,
    searchUnavailableCoachByTrain,
    clearCookie,
    getBookedTicketId,
    getTicket,
    getCode,
    returnTicket,
} from '../controller/apiController.js';

let router = express.Router();

const initAPIRoute = (app) => {
    router.get('/search/:trainid', getAllTrainSchedule);
    router.get('/search/:stationid', getAllTrainSchedule);
    router.post('/senddata', getData);
    router.get('/searchUnavailableSeatbyCoach', searchUnavailableSeatbyCoach);
    router.get('/searchUnavailableCoachByTrain', searchUnavailableCoachByTrain);
    router.post('/clearCookie', clearCookie);
    router.post('/getBookedTicketId', getBookedTicketId);
    router.post('/getTicket', getTicket);
    router.post('/getCode', getCode);
    router.post('/returnTicket', returnTicket);

    return app.use('/api/v1/', router);
};

export default initAPIRoute;
