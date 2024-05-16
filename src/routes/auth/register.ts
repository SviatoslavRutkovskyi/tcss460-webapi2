// express is the framework we're going to use to handle requests
import express, { Request, Response, Router, NextFunction } from 'express';
// We want to import our middleware functions defined elsewhere
import {
    emailMiddlewareCheck,
    passwordMiddlewareCheck,
    phoneMiddlewareCheck,
    roleMiddlewareCheck,
    parametersMiddlewareCheck,
} from '../../core/middleware/verificationChecks';

import jwt from 'jsonwebtoken';

const key = {
    secret: process.env.JSON_WEB_TOKEN,
};

import { pool, credentialingFunctions } from '../../core/utilities';

// const isStringProvided = validationFunctions.isStringProvided;
// const isNumberProvided = validationFunctions.isNumberProvided;
const generateHash = credentialingFunctions.generateHash;
const generateSalt = credentialingFunctions.generateSalt;

const registerRouter: Router = express.Router();

export interface IUserRequest extends Request {
    id: number;
}

/**
 * @api {post} /register Request to register a user
 *
 * @apiDescription  This route is used to register a new user.
 *                  The user must provide a unique email and username.
 *                  The password must be at least 8 characters long, and contain at least one special character and one number.
 *                  The phone number must be a valid phone number.
 *                  The role must be a number between 1 and 5.
 *
 * @apiUse EmailValidation
 * @apiUse PasswordValidation
 * @apiUse PhoneValidation
 * @apiUse RoleValidation
 *
 * @apiName PostAuth
 * @apiGroup Auth
 *
 * @apiBody {String} firstname a users first name
 * @apiBody {String} lastname a users last name
 * @apiBody {String} email a users email *unique
 * @apiBody {String} password a users password
 * @apiBody {String} username a username *unique
 * @apiBody {String} role a role for this user [1-5]
 * @apiBody {String} phone a phone number for this user
 *
 * @apiSuccess (Success 201) {string} accessToken a newly created JWT
 * @apiSuccess (Success 201) {number} id unique user id
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * @apiError (400: Invalid Password) {String} message "Invalid or missing password  - please refer to documentation"
 * @apiError (400: Invalid Phone) {String} message "Invalid or missing phone number  - please refer to documentation"
 * @apiError (400: Invalid Email) {String} message "Invalid or missing email  - please refer to documentation"
 * @apiError (400: Invalid Role) {String} message "Invalid or missing role  - please refer to documentation"
 * @apiError (400: Username exists) {String} message "Username exists"
 * @apiError (400: Email exists) {String} message "Email exists"
 *
 */
registerRouter.post(
    '/register',
    // We use these middleware checks defined in verificationChecks.ts to check all our user info
    emailMiddlewareCheck,
    passwordMiddlewareCheck,
    phoneMiddlewareCheck,
    roleMiddlewareCheck,
    parametersMiddlewareCheck,
    (request: IUserRequest, response: Response, next: NextFunction) => {
        const theQuery =
            'INSERT INTO Account(firstname, lastname, username, email, phone, account_role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING account_id';
        const values = [
            request.body.firstname,
            request.body.lastname,
            request.body.username,
            request.body.email,
            request.body.phone,
            request.body.role,
        ];
        pool.query(theQuery, values)
            .then((result) => {
                //stash the account_id into the request object to be used in the next function
                // NOTE the TYPE for the Request object in this middleware function
                request.id = result.rows[0].account_id;
                next();
            })
            .catch((error) => {
                //log the error
                // console.log(error)
                if (error.constraint == 'account_username_key') {
                    response.status(400).send({
                        message: 'Username exists',
                    });
                } else if (error.constraint == 'account_email_key') {
                    response.status(400).send({
                        message: 'Email exists',
                    });
                } else {
                    //log the error
                    console.error('DB Query error on register');
                    console.error(error);
                    response.status(500).send({
                        message: 'server error - contact support',
                    });
                }
            });
    },
    (request: IUserRequest, response: Response) => {
        //We're storing salted hashes to make our application more secure
        //If you're interested as to what that is, and why we should use it
        //watch this youtube video: https://www.youtube.com/watch?v=8ZtInClXe1Q
        const salt = generateSalt(32);
        const saltedHash = generateHash(request.body.password, salt);

        const theQuery =
            'INSERT INTO Account_Credential(account_id, salted_hash, salt) VALUES ($1, $2, $3)';
        const values = [request.id, saltedHash, salt];
        pool.query(theQuery, values)
            .then(() => {
                const accessToken = jwt.sign(
                    {
                        role: request.body.role,
                        id: request.id,
                    },
                    key.secret,
                    {
                        expiresIn: '14 days', // expires in 14 days
                    }
                );
                //We successfully added the user!
                response.status(201).send({
                    accessToken,
                    id: request.id,
                });
            })
            .catch((error) => {
                /***********************************************************************
                 * If we get an error inserting the PWD, we should go back and remove
                 * the user from the member table. We don't want a member in that table
                 * without a PWD! That implementation is up to you if you want to add
                 * that step.
                 **********************************************************************/

                //log the error
                console.error('DB Query error on register');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

registerRouter.get('/hash_demo', (request, response) => {
    const password = 'password12345';

    const salt = generateSalt(32);
    const saltedHash = generateHash(password, salt);
    const unsaltedHash = generateHash(password, '');

    response.status(200).send({
        salt: salt,
        salted_hash: saltedHash,
        unsalted_hash: unsaltedHash,
    });
});

export { registerRouter };
