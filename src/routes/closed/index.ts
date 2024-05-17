import express, { Router } from 'express';

import { checkToken } from '../../core/middleware';
import { tokenTestRouter } from './tokenTest';
import { messageRouter } from './message';
import { bookRouter } from './books';

const closedRoutes: Router = express.Router();

closedRoutes.use('/jwt_test', checkToken, tokenTestRouter);
closedRoutes.use('/message', messageRouter);
closedRoutes.use('/books', bookRouter);

export { closedRoutes };
