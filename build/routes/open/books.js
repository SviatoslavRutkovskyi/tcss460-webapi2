"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookRouter = void 0;
//express is the framework we're going to use to handle requests
const express_1 = __importDefault(require("express"));
//Access the connection to Postgres Database
const utilities_1 = require("../../core/utilities");
const bookRouter = express_1.default.Router();
exports.bookRouter = bookRouter;
function createInterface(resultRow) {
    let icons = {
        large: resultRow.image_url,
        small: resultRow.image_small_url,
    };
    // let count: number =
    //     resultRow.rating_1_star +
    //     resultRow.rating_2_star +
    //     resultRow.rating_3_star +
    //     resultRow.rating_4_star +
    //     resultRow.rating_5_star;
    // let avg: number =
    //     (resultRow.rating_1_star +
    //         resultRow.rating_2_star * 2 +
    //         resultRow.rating_3_star * 3 +
    //         resultRow.rating_4_star * 4 +
    //         resultRow.rating_5_star * 5) /
    //     count;
    let rating = {
        average: resultRow.rating_avg,
        count: resultRow.rating_count,
        rating_1: resultRow.rating_1_star,
        rating_2: resultRow.rating_2_star,
        rating_3: resultRow.rating_3_star,
        rating_4: resultRow.rating_4_star,
        rating_5: resultRow.rating_5_star,
    };
    let book = {
        isbn13: resultRow.isbn13,
        authors: resultRow.authors,
        publication: resultRow.original_publication_year,
        original_title: resultRow.original_title,
        title: resultRow.title,
        ratings: rating,
        icons: icons,
    };
    return book;
}
/**
 * @api {get} /book get all books
 *
 * @apiDescription Get all books from the database
 *
 * @apiName GetBook
 * @apiGroup Book
 *
 *
 * @apiSuccess (Success 201) {Object} entry the IBook object:
 * "IBook {
        isbn13: number;
        authors: string;
        publication: number;
        original_title: string;
        title: string;
        ratings: IRatings;
        icons: IUrlIcon;
}"
 *
 * @apiUse JSONError
 */
bookRouter.get('/all', (request, response) => {
    const theQuery = 'SELECT isbn13, authors, publication_year, original_title, title, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url FROM books';
    // const theQuery = 'SELECT * FROM books';
    utilities_1.pool.query(theQuery)
        .then((result) => {
        response.status(201).send({
            entries: result.rows.map(createInterface),
        });
    })
        .catch((error) => {
        //log the error
        console.error('DB Query error on GET all');
        console.error(error);
        response.status(500).send({
            message: 'server error - contact support',
        });
    });
});
bookRouter.get('/all', (request, response) => {
    const theQuery = 'SELECT isbn13, authors, publication_year, original_title, title, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url FROM books';
    // const theQuery = 'SELECT * FROM books';
    utilities_1.pool.query(theQuery)
        .then((result) => {
        response.status(201).send({
            entries: result.rows.map(createInterface),
        });
    })
        .catch((error) => {
        //log the error
        console.error('DB Query error on GET all');
        console.error(error);
        response.status(500).send({
            message: 'server error - contact support',
        });
    });
});
/**
 * @api {post} /book Request to add an entry
 *
 * @apiDescription Request to add a book  to the DB
 *
 * @apiName PostBooks
 * @apiGroup Books
 *
 * @apiBody {nubmer} isbn13 book isbn13 *unique
 * @apiBody {string} authors author of the given book
 * @apiBody {number} pulbication_year publication year of the book [0-2024]
 * @apiBody {string} original_title original title of the book
 * @apiBody {string} title title of the book
 * @apiBody {number} rating_1_star nuber of 1 star ratings [0+]
 * @apiBody {number} rating_2_star nuber of 2 star ratings [0+]
 * @apiBody {number} rating_3_star nuber of 3 star ratings [0+]
 * @apiBody {number} rating_4_star nuber of 4 star ratings [0+]
 * @apiBody {number} rating_5_star nuber of 5 star ratings [0+]
 * @apiBody {string} image_url image url
 * @apiBody {string} image_small_url small image url
 *
 * @apiSuccess (Success 201) {IBook} entry the IBook object:
 *      "IBook {
        isbn13: number;
        authors: string;
        publication: number;
        original_title: string;
        title: string;
        ratings: IRatings;
        icons: IUrlIcon;
}"
 *
 * @apiError (400: isbn13 exists) {String} message "isbn13 ${isbn13} already exists in the database"
 * @apiError (400: Invalid or missing isbn13) {String} message "Invalid or missing isbn13 - please refer to documentation"
 * @apiError (400: Invalid or missing author) {String} message "Invalid or missing author - please refer to documentation"
 * @apiError (400: Invalid or missing publication year) {String} message "Invalid or missing publication year - please refer to documentation"
 * @apiError (400: Invalid or missing original title) {String} message "Invalid or missing original title - please refer to documentation"
 * @apiError (400: Invalid or missing title) {String} message "Invalid or missing title - please refer to documentation"
 * @apiUse JSONError
 */
bookRouter.post('/', (request, response, next) => {
    const isbn13 = request.body.isbn13;
    if (utilities_1.validationFunctions.isNumberProvided(isbn13)) {
        const theQuery = 'SELECT 1 FROM books WHERE isbn13 = $1';
        const values = [isbn13];
        utilities_1.pool.query(theQuery, values)
            .then((result) => {
            if (result.rowCount > 0) {
                response.status(404).send({
                    message: `isbn13 ${isbn13} already exists in the database`,
                });
            }
            else {
                next();
            }
        })
            .catch((error) => {
            //log the error
            console.error('DB Query error on isbn13 uniquess validation');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
    }
    else {
        console.error('Invalid or missing isbn13');
        response.status(400).send({
            message: 'Invalid or missing isbn13 - please refer to documentation',
        });
    }
}, (request, response, next) => {
    const author = request.body.authors;
    if (utilities_1.validationFunctions.isStringProvided(author)) {
        next();
    }
    else {
        console.error('Invalid or missing author');
        response.status(400).send({
            message: 'Invalid or missing author - please refer to documentation',
        });
    }
}, (request, response, next) => {
    const publication_year = request.body
        .publication_year;
    if (utilities_1.validationFunctions.isNumberProvided(publication_year) &&
        parseInt(publication_year) < 2025 &&
        parseInt(publication_year) > 0) {
        next();
    }
    else {
        console.error('Invalid or missing publication year');
        response.status(400).send({
            message: 'Invalid or missing publication year - please refer to documentation',
        });
    }
}, (request, response, next) => {
    const original_title = request.body.original_title;
    if (utilities_1.validationFunctions.isStringProvided(original_title)) {
        next();
    }
    else {
        console.error('Invalid or missing original title');
        response.status(400).send({
            message: 'Invalid or missing original title - please refer to documentation',
        });
    }
}, (request, response, next) => {
    const title = request.body.title;
    if (utilities_1.validationFunctions.isStringProvided(title)) {
        next();
    }
    else {
        console.error('Invalid or missing title');
        response.status(400).send({
            message: 'Invalid or missing title - please refer to documentation',
        });
    }
}, (request, response, next) => {
    const rating_1_star = request.body.rating_1_star;
    if (utilities_1.validationFunctions.isNumberProvided(rating_1_star) &&
        parseInt(rating_1_star) >= 0) {
        next();
    }
    else {
        console.error('Invalid or missing 1 star rating');
        response.status(400).send({
            message: 'Invalid or missing 1 star rating - please refer to documentation',
        });
    }
}, (request, response, next) => {
    const rating_1_star = request.body.rating_1_star;
    if (utilities_1.validationFunctions.isNumberProvided(rating_1_star) &&
        parseInt(rating_1_star) >= 0) {
        next();
    }
    else {
        console.error('Invalid or missing 1 star rating');
        response.status(400).send({
            message: 'Invalid or missing 1 star rating - please refer to documentation',
        });
    }
}, (request, response) => {
    //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
    //If you want to read more: https://stackoverflow.com/a/8265319
    const theCountQuery = 'SELECT COUNT(*) FROM books';
    utilities_1.pool.query(theCountQuery)
        .then((result) => {
        const theQuery = 'INSERT INTO BOOKS(id, isbn13, authors, publication_year, original_title, title, rating_avg, rating_count, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *';
        let count = parseInt(request.body.rating_1_star) +
            parseInt(request.body.rating_2_star) +
            parseInt(request.body.rating_3_star) +
            parseInt(request.body.rating_4_star) +
            parseInt(request.body.rating_5_star);
        let avg = (parseInt(request.body.rating_1_star) +
            parseInt(request.body.rating_2_star) * 2 +
            parseInt(request.body.rating_3_star) * 3 +
            parseInt(request.body.rating_4_star) * 4 +
            parseInt(request.body.rating_5_star) * 5) /
            count;
        console.log(result.rows[0] + 1);
        const values = [
            result.rows[0] + 1,
            request.body.isbn13,
            request.body.authors,
            request.body.publication_year,
            request.body.original_title,
            request.body.title,
            avg,
            count,
            request.body.rating_1_star,
            request.body.rating_2_star,
            request.body.rating_3_star,
            request.body.rating_4_star,
            request.body.rating_5_star,
            request.body.image_url,
            request.body.image_small_url,
        ];
        utilities_1.pool.query(theQuery, values)
            .then((result) => {
            // result.rows array are the records returned from the SQL statement.
            // An INSERT statement will return a single row, the row that was inserted.
            response.status(201).send({
                entry: createInterface(result.rows[0]),
            });
        })
            .catch((error) => {
            if (error.detail != undefined &&
                error.detail.endsWith('already exists.')) {
                console.error('Name exists');
                response.status(400).send({
                    message: 'Name exists',
                });
            }
            else {
                //log the error
                console.error('DB Query error on POST');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            }
        });
    })
        .catch((error) => {
        console.error('DB Query error on POST, Count');
        console.error(error);
        response.status(500).send({
            message: 'server error - contact support',
        });
    });
});
//# sourceMappingURL=books.js.map