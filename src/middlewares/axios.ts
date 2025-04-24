import type { AnyLike, RecordLike } from 'ts-utils-helper';
import { filterNonNullish } from 'ts-utils-helper';
import type { HttpClientMiddleware, RequestOptions } from '../types';

const filterObjectSpecifyValue = <T extends RecordLike, U extends AnyLike[]>(obj: T, values: U) => {
    return Object.fromEntries(
        filterNonNullish(
            Object.entries(obj).map(([key, value]) => {
                if (values.includes(value)) {
                    return null;
                }
                return [key, value];
            }),
        ),
    );
};

/**
 * @description 同来处理axios 不同method 之间的传值差异 同时去除空值
 * @returns
 */
export const createAxiosMethodDiffMiddleware = (options?: RequestOptions): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        const { filterEmptyValues = [] } = options ?? {};
        const requestData = filterObjectSpecifyValue(requestConfig.data ?? {}, filterEmptyValues);
        requestConfig.data = requestData;
        if (`${requestConfig.method}`.toLowerCase() === 'get') {
            requestConfig.params = requestData;
        }
        if (`${requestConfig.method}`.toLowerCase() === 'delete') {
            const urlObj = new URL(requestConfig.url!, window.location.origin);
            // 遍历 data 对象
            for (const key in requestData) {
                const value = requestData[key];
                if (Array.isArray(value)) {
                    // 如果值是数组，遍历数组并添加每个元素
                    value.forEach((item) => {
                        urlObj.searchParams.append(key, `${item}`);
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
