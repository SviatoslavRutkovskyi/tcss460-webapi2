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
 * @api {get} /book get books
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

// "return" the router
export { bookRouter };
