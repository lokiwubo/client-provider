import type { Canceler } from 'axios';
import { isValidateNumber, TimeoutError, timeoutPromise } from 'ts-utils-helper';
import type { HttpClientMiddleware } from '../types';

/**
 * @description 用来控制请求超时
 * @param { number } time 超时时间，单位为毫秒
 * @returns
 */
export const createTimeoutMiddleware = (
    time?: number,
    cancelFn?: Canceler,
): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        try {
            const response = isValidateNumber(time)
                ? await timeoutPromise(() => next(requestConfig), time)
                : await next(requestConfig);
            return response;
        } catch (err) {
            if (err instanceof TimeoutError) {
                return cancelFn?.();
            }
            throw err;
        }
    };
};
