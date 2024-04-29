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
        small: resultRow.small_image_url,
    };
    let count: number =
        resultRow.ratings_1 +
        resultRow.ratings_2 +
        resultRow.ratings_3 +
        resultRow.ratings_4 +
        resultRow.ratings_5;
    let avg: number =
        (resultRow.ratings_1 +
            resultRow.ratings_2 * 2 +
            resultRow.ratings_3 * 3 +
            resultRow.ratings_4 * 4 +
            resultRow.ratings_5 * 5) /
        count;
    let rating: IRatings = {
        average: avg,
        count: count,
        rating_1: resultRow.ratings_1,
        rating_2: resultRow.ratings_2,
        rating_3: resultRow.ratings_3,
        rating_4: resultRow.ratings_4,
        rating_5: resultRow.ratings_5,
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

bookRouter.get('/all', (request: Request, response: Response) => {
    const theQuery =
        'SELECT isbn13, authors, publication_year, original_title, title, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url FROM books';
    // const theQuery = 'SELECT * FROM books';

    pool.query(theQuery)
        .then((result) => {
            response.send({
                entries: result.rows,
            });
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET all');
            console.error(error);
            response.status(500).send({
                message: 'THIS server error - contact support',
            });
        });
});

// "return" the router
export { bookRouter };
