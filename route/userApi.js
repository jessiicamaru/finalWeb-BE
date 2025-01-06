import express from 'express';
import { addUser, getUser, updateUser, getOrder } from '../controller/userController.js';

let router = express.Router();

const initUserRoute = (app) => {
    router.post('/add-user', addUser);
    router.get('/get-user', getUser);
    router.post('/update-user', updateUser);
    router.get('/get-order', getOrder);

    return app.use('/api/v3/', router);
};

export default initUserRoute;
