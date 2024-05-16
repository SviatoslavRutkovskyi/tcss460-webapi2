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
    const icons: IUrlIcon = {
        large: resultRow.image_url,
        small: resultRow.image_small_url,
    };
    const rating: IRatings = {
        average: resultRow.rating_avg,
        count: resultRow.rating_count,
        rating_1: resultRow.rating_1_star,
        rating_2: resultRow.rating_2_star,
        rating_3: resultRow.rating_3_star,
        rating_4: resultRow.rating_4_star,
        rating_5: resultRow.rating_5_star,
    };
    const book: IBook = {
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

// Middleware to validate ISBN and ratings
function validateBookData(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const {
        isbn13,
        rating_1_star,
        rating_2_star,
        rating_3_star,
        rating_4_star,
        rating_5_star,
    } = request.body;
    if (!isbn13 || isbn13.length !== 13) {
        response
            .status(400)
            .send('Invalid or missing isbn13 - please refer to documentation');
    } else if (
        rating_1_star === undefined ||
        rating_2_star === undefined ||
        rating_3_star === undefined ||
        rating_4_star === undefined ||
        rating_5_star === undefined
    ) {
        response
            .status(400)
            .send('Invalid or missing ratings – please refer to documentation');
    } else {
        next();
    }
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
    // Default values for pagination
    // console.log(request.query.page);
    let page = parseInt(request.query.page as string, 10);
    if (!page || page < 1) {
        page = 1; // Ensure page is always at least 1
    }

    let pageSize = parseInt(request.query.pageSize as string, 10);
    if (!pageSize || pageSize < 1) {
        pageSize = 10; // Provide a reasonable default and ensure it's positive
    }
    const offset = (page - 1) * pageSize;

    const theQuery = `
        SELECT isbn13, authors, publication_year, original_title, title, 
               rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, 
               image_url, image_small_url 
        FROM books
        LIMIT $1 OFFSET $2`;

    pool.query(theQuery, [pageSize, offset])
        .then((result) => {
            response.status(200).send({
                entries: result.rows.map(createInterface),
                currentPage: page,
                pageSize: pageSize,
            });
        })
        .catch((error) => {
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
 * @api {get} /book/author get all books with a specific author.
 *
 * @apiDescription Get all books from the database using a specific author even if the book has co-authors.
 *
 * @apiName GetBook
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
 * (404) Books not found by that author
 * (505) Connectivity issue to database or error with SQL query
 */
bookRouter.get('/author', (request: Request, response: Response) => {
    const { authorName } = request.query;
    const theQuery =
        'SELECT isbn13, authors, publication_year, original_title, title, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url FROM books WHERE authors ILIKE $1';

    pool.query(theQuery, [`%${authorName}%`])
        .then((result) => {
            if (result.rows.length > 0) {
                response.status(200).send({
                    entries: result.rows.map(createInterface),
                });
            } else {
                response
                    .status(404)
                    .send({ message: 'Book not found with that author(s)' }); //No book found in database
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
 * @api {get} /book/title get all books with a specific title.
 *
 * @apiDescription Get all books from the database using a specific title.
 *
 * @apiName GetBook
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
 * (404) Books not found by that title
 * (505) Connectivity issue to database or error with SQL query
 */
bookRouter.get('/title', (request: Request, response: Response) => {
    const { titleName } = request.query;
    const theQuery =
        'SELECT isbn13, authors, publication_year, original_title, title, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url FROM books WHERE original_title OR title ILIKE $1';

    pool.query(theQuery, [`%${titleName}%`])
        .then((result) => {
            if (result.rows.length > 0) {
                response.status(200).send({
                    entries: result.rows.map(createInterface),
                });
            } else {
                response
                    .status(404)
                    .send({ message: 'Book not found with that title' });
            }
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET title');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
});

/**
 * @api {get} /book/rating get all books with a specific rating equal to the value and higher.
 *
 * @apiDescription Get all books from the database using a rating.
 *
 * @apiName GetBook
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
 * (404) the minRating isn't validated/not a valid number.
 * (505) Connectivity issue to database or error with SQL query
 */
bookRouter.get('/rating', (request: Request, response: Response) => {
    const { minRating } = request.query; // Get the minimum rating from query parameters

    if (!minRating || isNaN(parseFloat(minRating as string))) {
        return response
            .status(400)
            .send({ message: 'Invalid or missing minRating parameter' });
    }

    const theQuery = `
        SELECT isbn13, authors, publication_year, original_title, title,
               rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star,
               image_url, image_small_url, average_rating
        FROM books
        WHERE average_rating >= $1`;

    pool.query(theQuery, [minRating])
        .then((result) => {
            if (result.rows.length > 0) {
                response.status(200).send({
                    entries: result.rows.map(createInterface),
                });
            } else {
                response.status(404).send({
                    message: 'No books found with the specified rating',
                });
            }
        })
        .catch((error) => {
            console.error('Database query error on GET ratings:', error);
            response.status(500).send({
                message: 'Server error - contact support',
            });
        });
});

/**
 * @api {get} /book/publication get all books with a specific publication year.
 *
 * @apiDescription Get all books from the database using a specific year.
 *
 * @apiName GetBook
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
 * (404) Books not found by that year
 * (505) Connectivity issue to database or error with SQL query
 */
bookRouter.get('/publication', (request: Request, response: Response) => {
    const { year } = request.query;
    if (!year || isNaN(parseInt(year as string))) {
        return response
            .status(400)
            .send({ message: 'Invalid or missing year parameter' });
    }

    const theQuery =
        'SELECT isbn13, authors, publication_year, original_title, title, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, image_url, image_small_url FROM books WHERE publication_year = $1';

    pool.query(theQuery, [`%${year}%`])
        .then((result) => {
            if (result.rows.length > 0) {
                response.status(200).send({
                    entries: result.rows.map(createInterface),
                });
            } else {
                response
                    .status(404)
                    .send({ message: 'Book not found with that year' }); //No book found in database
            }
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET publication');
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
                const count: number =
                    parseInt(request.body.rating_1_star) +
                    parseInt(request.body.rating_2_star) +
                    parseInt(request.body.rating_3_star) +
                    parseInt(request.body.rating_4_star) +
                    parseInt(request.body.rating_5_star);
                const avg: number =
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

/**
 * @api {put} /books Request to alter an exisitng entry
 *
 * @apiDescription Request to alter a books rating within the DB
 *
 * @apiName PutBooks
 * @apiGroup Books
 *
 * @apiBody {number} isbn13 book isbn13 *unique [13 digits]
 * @apiBody {number} rating_1_star number of 1 star ratings [0+]
 * @apiBody {number} rating_2_star number of 2 star ratings [0+]
 * @apiBody {number} rating_3_star number of 3 star ratings [0+]
 * @apiBody {number} rating_4_star number of 4 star ratings [0+]
 * @apiBody {number} rating_5_star number of 5 star ratings [0+]
 *
* @apiSuccess (Success 200) {IBook} entry the IBook object:
 *      "Updated: {
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
 * @apiError (400: Invalid or missing rating information) {String} message "Invalid or missing ratings - please refer to documentation"
 * @apiError (500) Internal error with the query or connectivity issue to database
 * @apiUse JSONError
 */

/**
 * Old .put functionality that overwrote the ratings
bookRouter.put(
    '/',
    validateBookData,
    (request: Request, response: Response) => {
        const {
            isbn13,
            rating_1_star,
            rating_2_star,
            rating_3_star,
            rating_4_star,
            rating_5_star,
        } = request.body;
        const theQuery = `UPDATE Books SET rating_1_star = $1, rating_2_star = $2, rating_3_star = $3, rating_4_star = $4, rating_5_star = $5 WHERE isbn13 = $6 RETURNING *`;
        const values = [
            rating_1_star,
            rating_2_star,
            rating_3_star,
            rating_4_star,
            rating_5_star,
            isbn13,
        ];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount === 1) {
                    response.send({ updated: createInterface(result.rows[0]) });
                } else {
                    response.status(404).send('ISBN not found');
                }
            })
            .catch((error) => {
                console.error('DB Query error on PUT', error);
                response.status(500).send({
                    message: 'Server error - contact support',
                    error: error.message,
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
 */
bookRouter.put(
    '/',
    validateBookData,
    async (request: Request, response: Response) => {
        const {
            isbn13,
            rating_1_star,
            rating_2_star,
            rating_3_star,
            rating_4_star,
            rating_5_star,
        } = request.body;

        try {
            await pool.query('BEGIN');
            const currentRatingsQuery =
                'SELECT rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star, rating_count FROM Books WHERE isbn13 = $1';
            const currentResult = await pool.query(currentRatingsQuery, [
                isbn13,
            ]);
            if (currentResult.rows.length === 0) {
                response.status(404).send('ISBN not found');
                return;
            }

            const current = currentResult.rows[0];
            const updatedRatings = {
                rating_1_star:
                    Number(current.rating_1_star) + Number(rating_1_star),
                rating_2_star:
                    Number(current.rating_2_star) + Number(rating_2_star),
                rating_3_star:
                    Number(current.rating_3_star) + Number(rating_3_star),
                rating_4_star:
                    Number(current.rating_4_star) + Number(rating_4_star),
                rating_5_star:
                    Number(current.rating_5_star) + Number(rating_5_star),
            };
            //console.log('Updated Ratings: ', updatedRatings);
            const newCount =
                updatedRatings.rating_1_star +
                updatedRatings.rating_2_star +
                updatedRatings.rating_3_star +
                updatedRatings.rating_4_star +
                updatedRatings.rating_5_star;
            //console.log('New Count: ', newCount);
            const totalStars =
                Number(updatedRatings.rating_1_star) +
                Number(updatedRatings.rating_2_star) * 2 +
                Number(updatedRatings.rating_3_star) * 3 +
                Number(updatedRatings.rating_4_star) * 4 +
                Number(updatedRatings.rating_5_star) * 5;
            //console.log('Total Stars: ', totalStars);
            const newAverage = totalStars / newCount;
            //console.log('New Average: ', newAverage);

            const updateQuery =
                'UPDATE Books SET rating_1_star = $1, rating_2_star = $2, rating_3_star = $3, rating_4_star = $4, rating_5_star = $5, rating_count = $6, rating_avg = $7 WHERE isbn13 = $8' +
                ' RETURNING isbn13, authors, publication_year, original_title, title, rating_avg, rating_count, rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star;';
            const updateValues = [
                updatedRatings.rating_1_star,
                updatedRatings.rating_2_star,
                updatedRatings.rating_3_star,
                updatedRatings.rating_4_star,
                updatedRatings.rating_5_star,
                Number(newCount),
                Number(newAverage),
                isbn13,
            ];
            //console.log('Update Values: ', updateValues);
            const updateResult = await pool.query(updateQuery, updateValues);
            await pool.query('COMMIT');
            response.send({ updated: updateResult.rows[0] });
        } catch (error) {
            await pool.query('ROLLBACK');
            response.status(500).send(error.toString());
        }
    }
);

/**
 * @api {delete} /book Delete a book by ISBN
 * @apiDescription Delete a book from the database by ISBN
 *
 * @apiName DeleteBook
 * @apiGroup Book
 *
 * @apiParam {number} isbn13 ISBN number of the book to delete
 *
 * @apiSuccess (Success 200) {String} message "Book deleted successfully"
 * @apiError (404) {String} message "Book not found"
 * @apiError (500) {String} message "Internal server error - contact support"
 */
bookRouter.delete('/', (request: Request, response: Response) => {
    const { isbn13 } = request.body;

    if (!isbn13) {
        return response.status(400).send({
            message: 'ISBN number is required',
        });
    }

    const deleteQuery = 'DELETE FROM books WHERE isbn13 = $1';

    pool.query(deleteQuery, [isbn13])
        .then((result) => {
            if (result.rowCount > 0) {
                response.status(200).send({
                    message: 'Book deleted successfully',
                });
            } else {
                response.status(404).send({
                    message: 'Book not found',
                });
            }
        })
        .catch((error) => {
            console.error('DB Query error on DELETE');
            console.error(error);
            response.status(500).send({
                message: 'Internal server error - contact support',
            });
        });
});

// "return" the router
export { bookRouter };
