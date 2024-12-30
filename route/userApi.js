import express from 'express';
import { addUser } from '../controller/userController.js';

let router = express.Router();

const initUserRoute = (app) => {
    router.post('/add-user', addUser);

    return app.use('/api/v3/', router);
};

export default initUserRoute;
