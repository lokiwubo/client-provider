import { delay } from 'ts-utils-helper';
import type { HttpClientMiddleware } from '../types';

/**
 * @description
 * @returns
 */
export const createDelayMiddleware = (time: number): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        return delay(time, () => next(requestConfig));
    };
};
