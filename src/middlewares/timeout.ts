import { timeoutPromise } from 'ts-utils-helper';
import type { HttpClientMiddleware } from '../types';

/**
 * @description 用来控制请求超时
 * @param { number } time 超时时间，单位为毫秒
 * @returns
 */
export const createTimeoutMiddleware = (time: number): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        return timeoutPromise(() => next(requestConfig), time);
    };
};
