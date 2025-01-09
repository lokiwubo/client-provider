import { delay, isValidateNumber } from 'ts-utils-helper';
import type { HttpClientMiddleware } from '../types';

/**
 * @description 延时中间件
 * @param {number} [time] 延时时间，单位：毫秒
 * @returns
 */
export const createDelayMiddleware = (time?: number): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        return isValidateNumber(time)
            ? delay(time, () => next(requestConfig))
            : next(requestConfig);
    };
};
