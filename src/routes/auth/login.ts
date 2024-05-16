// express is the framework we're going to use to handle requests
import express, { Request, Response, Router } from 'express';

import jwt from 'jsonwebtoken';

import { pool, credentialingFunctions } from '../../core/utilities';

// We want to import our middleware functions defined elsewhere
import { loginParametersMiddlewareCheck } from '../../core/middleware/verificationChecks';

export interface Auth {
    email: string;
    password: string;
}

export interface AuthRequest extends Request {
    auth: Auth;
}

const generateHash = credentialingFunctions.generateHash;

const signinRouter: Router = express.Router();

const key = {
    secret: process.env.JSON_WEB_TOKEN,
};

/**
 * @api {post} /login Request to sign a user in the system
 *
 * @apiDescription This route is used to sign a user in the system. The user must provide a valid username and password.
 *
 * @apiName GetAuth
 * @apiGroup Auth
 *
 * @apiHeader {String} authorization "username:password" uses Basic Auth
 *
 * @apiSuccess (Success 201) {String} accessToken JSON Web Token
 * @apiSuccess (Success 201) {number} id unique user id
 *
 * @apiError (400: Missing Parameters) {String} message "Missing password/username or both"
 * @apiError (404: User Not Found) {String} message "User not found"
 * @apiError (400: Invalid Credentials) {String} message "Credentials did not match"
 */
signinRouter.post(
    '/login',
    loginParametersMiddlewareCheck,
    (request: AuthRequest, response: Response) => {
        const theQuery = `SELECT salted_hash, salt, Account_Credential.account_id, account.email, account.firstname, account.lastname, account.phone, account.username, account.account_role FROM Account_Credential
                      INNER JOIN Account ON
                      Account_Credential.account_id=Account.account_id 
                      WHERE Account.username=$1`;
        const values = [request.body.username];
        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: 'User not found',
                    });
                    return;
                } else if (result.rowCount > 1) {
                    //log the error
                    console.error(
                        'DB Query error on sign in: too many results returned'
                    );
                    response.status(500).send({
                        message: 'server error - contact support',
                    });
                    return;
                }

                //Retrieve the salt used to create the salted-hash provided from the DB
                const salt = result.rows[0].salt;

                //Retrieve the salted-hash password provided from the DB
                const storedSaltedHash = result.rows[0].salted_hash;

                //Generate a hash based on the stored salt and the provided password
                const providedSaltedHash = generateHash(
                    request.body.password,
                    salt
                );

                //Did our salted hash match their salted hash?
                if (storedSaltedHash === providedSaltedHash) {
                    //credentials match. get a new JWT
                    const accessToken = jwt.sign(
                        {
                            name: result.rows[0].firstname,
                            role: result.rows[0].account_role,
                            id: result.rows[0].account_id,
                        },
                        key.secret,
                        {
                            expiresIn: '14 days', // expires in 14 days
                        }
                    );
                    //package and send the results
                    response.status(201).json({
                        accessToken,
                        id: result.rows[0].account_id,
                    });
                } else {
                    //credentials dod not match
                    response.status(400).send({
                        message: 'Credentials did not match',
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on sign in');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

export { signinRouter };
