/**
 * Checks the parameter to see if it is a a String.
 *
 * @param {any} candidate the value to check
 * @returns true if the parameter is a String0, false otherwise
 */
function isString(candidate: any): candidate is string {
    return typeof candidate === 'string';
}

/**
 * Checks the parameter to see if it is a a String with a length greater than 0.
 *
 * @param {any} candidate the value to check
 * @returns true if the parameter is a String with a length greater than 0, false otherwise
 */
function isStringProvided(candidate: any): boolean {
    return isString(candidate) && candidate.length > 0;
}

/**
 * Checks the parameter to see if it can be converted into a number.
 *
 * @param {any} candidate the value to check
 * @returns true if the parameter is a number, false otherwise
 */
function isNumberProvided(candidate: any): boolean {
    return (
        isNumber(candidate) ||
        (candidate != null &&
            candidate != '' &&
            !isNaN(Number(candidate.toString())))
    );
}

/**
 * Helper
 * @param x data value to check the type of
 * @returns true if the type of x is a number, false otherise
 */
function isNumber(x: any): x is number {
    return typeof x === 'number';
}

// Here we will define the regex to validate our different user data
const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex: RegExp = /^\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}$/;
const passwordRegex: RegExp =
    /^(?=.*[0-9])(?=.*[^a-zA-Z0-9])[a-zA-Z0-9\s!@#$%^&*()-_+=?.,;:{}[\]]{8,}$/;

/**
 * @apiDefine PasswordValidation
 * @apiParam {String} password The user's password. This must be a string containing at least 8 characters, with at least one special character and one number.
 *                    This password can contain any combination of any amount of special characters (including spaces), numbers, and letters once the other requirements are met.
 */
const isValidPassword = (password: string): boolean =>
    isStringProvided(password) && passwordRegex.test(password);

/**
 * @apiDefine PhoneValidation
 * @apiParam {String} phone The user's phone number. This must be a valid phone number containing 10 numbers.
 *                                                   The phone number can be in the format of 123-456-7890, 123.456.7890, 1234567890, (123) 456-7890, etc.
 */
const isValidPhone = (phone: string): boolean =>
    isStringProvided(phone) && phoneRegex.test(phone);

/**
 * @apiDefine RoleValidation
 * @apiParam {String} role The user's role. This must be a number between 1 and 5.
 */
const isValidRole = (priority: string): boolean =>
    validationFunctions.isNumberProvided(priority) &&
    parseInt(priority) >= 1 &&
    parseInt(priority) <= 5;

/**
 * @apiDefine EmailValidation
 * @apiParam {String} email The user's email. This must be a valid email address in the format: [name]@[domain].[top-level domain].
 */
const isValidEmail = (email: string): boolean =>
    // Here we are using some regex to just check if the email follows regular email format [somename]@[domain].[something]
    isStringProvided(email) && emailRegex.test(email);

// Feel free to add your own validations functions!
// for example: isNumericProvided, isValidPassword, isValidEmail, etc
// don't forget to export any
const validationFunctions = {
    isStringProvided,
    isNumberProvided,
    isValidPassword,
    isValidPhone,
    isValidRole,
    isValidEmail,
};

export { validationFunctions };
