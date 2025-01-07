import type { HttpClientMiddleware } from '../types';

/**
 * @description 同来处理axios 不同method 之间的传值差异
 * @returns
 */
export const createAxiosMethodDiffMiddleware = (): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        if (`${requestConfig.method}`.toLowerCase() === 'get') {
            requestConfig.params = requestConfig.data;
        }
        return next(requestConfig);
    };
};
