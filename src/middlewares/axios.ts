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
        if (`${requestConfig.method}`.toLowerCase() === 'delete') {
            const urlObj = new URL(requestConfig.url!, window.location.origin);
            // 遍历 data 对象
            for (const key in requestConfig.data) {
                const value = requestConfig.data[key];
                if (Array.isArray(value)) {
                    // 如果值是数组，遍历数组并添加每个元素
                    value.forEach((item) => {
                        urlObj.searchParams.append(key, item);
                    });
                } else {
                    // 否则直接设置该参数
                    if (urlObj.searchParams.has(key)) {
                        urlObj.searchParams.append(key, value);
                    } else {
                        urlObj.searchParams.set(key, value);
                    }
                }
            }
            requestConfig.url = urlObj.pathname + urlObj.search;
        }
        return next(requestConfig);
    };
};
