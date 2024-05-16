import { NextFunction, Response, Request } from 'express';
import { IJwtRequest } from '../models/JwtRequest.model';
// We need to import the validation functions to help in our middleware functions
import { validationFunctions } from '../utilities';
// Here we are grabbing all of the validation functions that we need
const isValidEmail = validationFunctions.isValidEmail;
const isValidPassword = validationFunctions.isValidPassword;
const isValidPhone = validationFunctions.isValidPhone;
const isValidRole = validationFunctions.isValidRole;
const isStringProvided = validationFunctions.isStringProvided;

export const checkParamsIdToJwtId = (
    request: IJwtRequest,
    response: Response,
    next: NextFunction
) => {
    if (request.params.id !== request.claims.id) {
        response.status(400).send({
            message: 'Credentials do not match for this user.',
        });
    }
    next();
};

export const emailMiddlewareCheck = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    if (isValidEmail(request.body.email)) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing email  - please refer to documentation',
        });
    }
};

export const passwordMiddlewareCheck = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    if (isValidPassword(request.body.password)) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing password  - please refer to documentation',
        });
    }
};

export const phoneMiddlewareCheck = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    if (isValidPhone(request.body.phone)) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing phone number  - please refer to documentation',
        });
    }
};

export const roleMiddlewareCheck = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    if (isValidRole(request.body.role)) {
        next();
    } else {
        response.status(400).send({
            message: 'Invalid or missing role  - please refer to documentation',
        });
    }
};

export const parametersMiddlewareCheck = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    //Verify that the caller supplied all the parameters
    //In js, empty strings or null values evaluate to false
    if (
        isStringProvided(request.body.firstname) &&
        isStringProvided(request.body.lastname) &&
        isStringProvided(request.body.username)
    ) {
        next();
    } else {
        response.status(400).send({
            message: 'Missing required information',
        });
    }
};

export const loginParametersMiddlewareCheck = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    if (
        isStringProvided(request.body.username) &&
        isStringProvided(request.body.password)
    ) {
        next();
    } else {
        response.status(400).send({
            message: 'Missing password/username or both',
        });
    }
};
