import express from 'express';
import getRoute from './get';
import postRoute from './post';
import teamRoute from './team';
const router = express.Router();

router.use('/', getRoute);
router.use('/', postRoute);
router.use('/', teamRoute);

export default router;
