//express is the framework we're going to use to handle requests
import express, {
    NextFunction,
    Request,
    Response,
    Router,
    response,
} from 'express';
//Access the connection to Postgres Database
import { pool, validationFunctions } from '../../core/utilities';

export interface IRatings {
    average: number;
    count: number;
    rating_1: number;
    rating_2: number;
    rating_3: number;
    rating_4: number;
    rating_5: number;
}
export interface IUrlIcon {
    large: string;
    small: string;
}
export interface IBook {
    isbn13: number;
    authors: string;
    publication: number;
    original_title: string;
    title: string;
    ratings: IRatings;
    icons: IUrlIcon;
}
export interface IBookRequest extends Request {
    book: IBook;
}

const bookRouter: Router = express.Router();

function createInterface(resultRow): IBook {
    let icons: IUrlIcon = {
        large: resultRow.image_url,
        small: resultRow.image_small_url,
    };
    let rating: IRatings = {
        average: resultRow.rating_avg,
        count: resultRow.rating_count,
        rating_1: resultRow.rating_1_star,
        rating_2: resultRow.rating_2_star,
        rating_3: resultRow.rating_3_star,
        rating_4: resultRow.rating_4_star,
        rating_5: resultRow.rating_5_star,
    };
    let book: IBook = {
        isbn13: resultRow.isbn13,
        authors: resultRow.authors,
        publication: resultRow.publication_year,
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
bookRouter.get('/all', (request: Request, response: Response) => {
    const theQuery =
        'SELECT isbn13, authors, publication_year, original_title, title, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url FROM books';
    // const theQuery = 'SELECT * FROM books';

    pool.query(theQuery)
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
 * @api {get} /isbn get book information based on isbn
 *
 * @apiDescription Get book from the database based on isbn
 *
 * @apiName GetISBN
 * @apiGroup Book
 *
 *
 * @apiSuccess (Success 200) {Object} entry the IBook object:
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
 * @apiError (404) Book not found in the database
 * @apiError (500) Internal error with the query or connectivity issue to database
 */
bookRouter.get('/isbn', (request: Request, response: Response) => {
    const { id } = request.query;
    const theQuery =
        'SELECT isbn13, authors, publication_year, original_title, title, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url FROM books WHERE isbn13 = $1';

    pool.query(theQuery, [id])
        .then((result) => {
            if (result.rows.length > 0) {
                response.status(200).send({
                    entries: result.rows[0],
                });
            } else {
                response.status(404).send({ message: 'Book not found' }); //No book found in database
            }
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET ISBN');
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
 * @apiBody {nubmer} isbn13 book isbn13 *unique [13 digits]
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
 * @apiError (400: Invalid or missing isbn13) {String} message "Invalid or missing isbn13 - please refer to documentation"
 * @apiError (400: isbn13 exists) {String} message "isbn13 ${isbn13} already exists in the database"
 * @apiError (400: Invalid or missing author) {String} message "Invalid or missing author - please refer to documentation"
 * @apiError (400: Invalid or missing publication year) {String} message "Invalid or missing publication year - please refer to documentation"
 * @apiError (400: Invalid or missing original title) {String} message "Invalid or missing original title - please refer to documentation"
 * @apiError (400: Invalid or missing title) {String} message "Invalid or missing title - please refer to documentation"
 * @apiError (400: Invalid or missing rating information) {String} message "Invalid or missing rating information - please refer to documentation"
 * @apiUse JSONError
 */
bookRouter.post(
    '/',
    (request: Request, response: Response, next: NextFunction) => {
        const isbn13: string = request.body.isbn13 as string;
        if (
            validationFunctions.isNumberProvided(isbn13) &&
            isbn13.length == 13
        ) {
            next();
        } else {
            console.error('Invalid or missing isbn13');
            response.status(400).send({
                message:
                    'Invalid or missing isbn13 - please refer to documentation',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        const isbn13: string = request.body.isbn13 as string;
        const theQuery = 'SELECT 1 FROM books WHERE isbn13 = $1';
        const values = [isbn13];
        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.status(400).send({
                        message: `isbn13 ${isbn13} already exists in the database`,
                    });
                } else {
                    next();
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on isbn13 uniquess validation');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support 1',
                    cl: 'failed on isbn13 validation',
                });
            });
    },
    (request: Request, response: Response, next: NextFunction) => {
        const author: string = request.body.authors as string;
        if (validationFunctions.isStringProvided(author)) {
            next();
        } else {
            console.error('Invalid or missing author');
            response.status(400).send({
                message:
                    'Invalid or missing author - please refer to documentation',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        const publication_year: string = request.body
            .publication_year as string;
        if (
            validationFunctions.isNumberProvided(publication_year) &&
            parseInt(publication_year) < 2025 &&
            parseInt(publication_year) > 0
        ) {
            next();
        } else {
            console.error('Invalid or missing publication year');
            response.status(400).send({
                message:
                    'Invalid or missing publication year - please refer to documentation',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        const original_title: string = request.body.original_title as string;
        if (validationFunctions.isStringProvided(original_title)) {
            next();
        } else {
            console.error('Invalid or missing original title');
            response.status(400).send({
                message:
                    'Invalid or missing original title - please refer to documentation',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        const title: string = request.body.title as string;
        if (validationFunctions.isStringProvided(title)) {
            next();
        } else {
            console.error('Invalid or missing title');
            response.status(400).send({
                message:
                    'Invalid or missing title - please refer to documentation',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        const rating_1_star: string = request.body.rating_1_star as string;
        const rating_2_star: string = request.body.rating_2_star as string;
        const rating_3_star: string = request.body.rating_3_star as string;
        const rating_4_star: string = request.body.rating_4_star as string;
        const rating_5_star: string = request.body.rating_5_star as string;
        if (
            validationFunctions.isNumberProvided(rating_1_star) &&
            validationFunctions.isNumberProvided(rating_2_star) &&
            validationFunctions.isNumberProvided(rating_3_star) &&
            validationFunctions.isNumberProvided(rating_4_star) &&
            validationFunctions.isNumberProvided(rating_5_star) &&
            parseInt(rating_1_star) >= 0 &&
            parseInt(rating_2_star) >= 0 &&
            parseInt(rating_3_star) >= 0 &&
            parseInt(rating_4_star) >= 0 &&
            parseInt(rating_5_star) >= 0
        ) {
            next();
        } else {
            console.error('Invalid or missing rating information');
            response.status(400).send({
                message:
                    'Invalid or missing rating information - please refer to documentation',
            });
        }
    },
    (request: Request, response: Response) => {
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319
        const theCountQuery = 'SELECT MAX(id) FROM books';
        pool.query(theCountQuery)
            .then((result) => {
                const theQuery =
                    'INSERT INTO BOOKS(id, isbn13, authors, publication_year, original_title, title, rating_avg, rating_count, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *';
                let count: number =
                    parseInt(request.body.rating_1_star) +
                    parseInt(request.body.rating_2_star) +
                    parseInt(request.body.rating_3_star) +
                    parseInt(request.body.rating_4_star) +
                    parseInt(request.body.rating_5_star);
                let avg: number =
                    (parseInt(request.body.rating_1_star) +
                        parseInt(request.body.rating_2_star) * 2 +
                        parseInt(request.body.rating_3_star) * 3 +
                        parseInt(request.body.rating_4_star) * 4 +
                        parseInt(request.body.rating_5_star) * 5) /
                    count;
                const values = [
                    parseInt(result.rows[0].max) + 1,
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

                pool.query(theQuery, values)
                    .then((result) => {
                        // result.rows array are the records returned from the SQL statement.
                        // An INSERT statement will return a single row, the row that was inserted.
                        response.status(201).send({
                            entry: createInterface(result.rows[0]),
                        });
                    })
                    .catch((error) => {
                        if (
                            error.detail != undefined &&
                            (error.detail as string).endsWith('already exists.')
                        ) {
                            console.error('Name exists');
                            response.status(400).send({
                                message: 'Name exists',
                            });
                        } else {
                            //log the error
                            console.error('DB Query error on POST');
                            console.error(error);
                            response.status(500).send({
                                message: 'server error - contact support 2',
                                cl: result.rows[0].count + 1,
                            });
                        }
                    });
            })
            .catch((error) => {
                console.error('DB Query error on POST, Count');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support 3',
                    cl: 'failed on count',
                });
            });
    }
);

// "return" the router
export { bookRouter };
