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
 * The password of a user must be at least 8 characters long, and contain at least one special character and one number.
 *
 * @param password The password of the user.
 * @returns Whether the user password is valid.
 */
const isValidPassword = (password: string): boolean =>
    isStringProvided(password) && passwordRegex.test(password);

/**
 * The phone number of a user must be a valid number. This can be in any possible format that is valid for a phone number.
 *
 * @param phone The phone number of the user.
 * @returns Whether the user has a valid phone number.
 */
const isValidPhone = (phone: string): boolean =>
    isStringProvided(phone) && phoneRegex.test(phone);

/**
 * The role of a user must be between 1-5. This is used to determine the priority of the user in the system.
 *
 * @param priority The number dictating the role of the user (i.e., how much priority a user gets in the system)
 * @returns Whether the user has a valid role.
 */
const isValidRole = (priority: string): boolean =>
    validationFunctions.isNumberProvided(priority) &&
    parseInt(priority) >= 1 &&
    parseInt(priority) <= 5;

/**
 * The email of a user must be a valid email address in the format: name@domain.topleveldomain
 *
 * @param email The email of the user.
 * @returns Whether the user has a valid email.
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
