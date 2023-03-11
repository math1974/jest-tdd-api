// Testing Middleware

import { UnauthorizedError } from 'express-jwt/lib';

import errorMiddleware from "utils/error-middleware";

import { buildRes, buildError, buildNext } from "utils/generate";

// 💣 remove this todo test (it's only here so you don't get an error about missing tests)
test.todo('remove me')

describe('validate error middleware', () => {
    test('errorMiddleware: has headers sent', () => {
        const next = buildNext();

        const error = buildError({
            message: 'HEADER_SENT'
        });

        const res = buildRes({
            headersSent: true
        });

        errorMiddleware(error, null, res, next)

        expect(next).toBeCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });

    test('errorMiddleware: has unauthorized error', () => {
        const next = buildNext();

        const unauthorizedErrorOptions = {
            message: 'UNAUTHORIZED',
            code: 401
        };

        const error = buildError(new UnauthorizedError(unauthorizedErrorOptions.code, unauthorizedErrorOptions));

        const res = buildRes();

        errorMiddleware(error, null, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(next).not.toHaveBeenCalled();
        expect(res.json).toBeCalledWith(unauthorizedErrorOptions);
    });

    test('errorMiddleware: header was not sent and is not a instance of UnauthorizedError', () => {
        const next = buildNext();

        const error = buildError({
            message: 'ERROR MESSAGE',
            stack: 'ROUTE  NOT FOUND'
        });

        const res = buildRes();

        errorMiddleware(error, null, res, next);

        expect(res.status).toBeCalledWith(500);

        expect(res.json).toBeCalledWith({
            message: error.message,
            ...(process.env.NODE_ENV === 'production' ? null : { stack: error.stack })
        });
    });
})

