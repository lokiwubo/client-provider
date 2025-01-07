import { retryPromise } from 'ts-utils-helper';
import type { HttpClientMiddleware } from '../types';

/**
 * @description 用来处理错误重试的中间件
 * @returns
 */
export const createRetryMiddleware = (retryNumber: number): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        return retryPromise(() => next(requestConfig), retryNumber);
    };
};
