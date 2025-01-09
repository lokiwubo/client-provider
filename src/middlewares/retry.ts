import { isValidateNumber, retryPromise } from 'ts-utils-helper';
import type { HttpClientMiddleware } from '../types';

/**
 * @description 用来处理错误重试的中间件
 * @param {number} [retryNumber] 重试次数
 * @returns
 */
export const createRetryMiddleware = (retryNumber?: number): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        return isValidateNumber(retryNumber)
            ? retryPromise(() => next(requestConfig), retryNumber)
            : next(requestConfig);
    };
};
