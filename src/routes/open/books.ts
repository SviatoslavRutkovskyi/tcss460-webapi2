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
 * (404) Book not found in the database
 * (500) Internal error with the query or connectivity issue to database
 */
bookRouter.get('/isbn', (request: Request, response: Response) => {
    const {id} = request.query;
    const theQuery =
        'SELECT isbn13, authors, publication_year, original_title, title, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url FROM books WHERE isbn13 = $1';

    pool.query(theQuery, [id])
        .then((result) => {
            if (result.rows.length > 0) {
                response.status(200).send({
                    entries: result.rows[0]
                });  
            } else {
                response.status(404).send({ message: 'Book not found' });  //No book found in database
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

bookRouter.post(
    '/',
    (request: Request, response: Response, next: NextFunction) => {
        const isbn13: string = request.body.isbn13 as string;
        if (validationFunctions.isNumberProvided(isbn13)) {
            const theQuery = 'SELECT 1 FROM books WHERE isbn13 = $1';
            const values = [isbn13];
            pool.query(theQuery, values)
                .then((result) => {
                    if (result.rowCount > 0) {
                        response.status(404).send({
                            message: `isbn13 ${isbn13} already exists in the database`,
                        });
                    } else {
                        next();
                    }
                })
                .catch((error) => {
                    //log the error
                    console.error(
                        'DB Query error on isbn13 uniquess validation'
                    );
                    console.error(error);
                    response.status(500).send({
                        message: 'server error - contact support',
                    });
                });
        } else {
            console.error('Invalid or missing isbn13');
            response.status(400).send({
                message:
                    'Invalid or missing isbn13 - please refer to documentation',
            });
        }
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
    (request: Request, response: Response) => {
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319
        const theQuery =
            'INSERT INTO DEMO(Name, Message, Priority) VALUES ($1, $2, $3) RETURNING *';
        const values = [
            request.body.name,
            request.body.message,
            request.body.priority,
        ];

        pool.query(theQuery, values)
            .then((result) => {
                // result.rows array are the records returned from the SQL statement.
                // An INSERT statement will return a single row, the row that was inserted.
                response.status(201).send({
                    // entry: format(result.rows[0]),
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
                        message: 'server error - contact support',
                    });
                }
            });
    }
);

// "return" the router
export { bookRouter };
