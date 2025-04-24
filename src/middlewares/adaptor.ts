/**
 * 暂不使用
 */
import type { AnyLike } from 'ts-utils-helper';
import type { HttpClientMiddleware, RequestOptions } from '../types';
type ClientResponseCacheData<T> = {
    data: T;
    updateAt: number;
};
const createResponseCacheData = <T>(data: T): ClientResponseCacheData<T> => {
    return {
        data,
        updateAt: Date.now(),
    };
};

/**
 * @description 前置拦截器 处理请求参数转换 请求去重 读取缓存
 * @param requestCache
 * @param responseCache
 * @param options
 * @returns
 */
export const createRequestAdaptorMiddleware = (
    cacheKey: string,
    requestCache: Map<string, Promise<AnyLike>>,
    responseCache: Map<string, ClientResponseCacheData<AnyLike>>,
    options?: RequestOptions,
): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        // 请求前置拦截器
        const requestAdaptorData = requestConfig;
        const cacheResponse = responseCache.get(cacheKey);
        //缓存命中
        if (
            cacheResponse &&
            options?.cacheTime &&
            Date.now() - cacheResponse.updateAt < options.cacheTime
        ) {
            return cacheResponse.data;
        }
        // 请求去重 并缓存请求
        try {
            if (!requestCache.has(cacheKey)) {
                requestAdaptorData.url = (requestAdaptorData.url ?? '')
                    .replace('//', '/')
                    .replace(/\/$/, '');
                requestCache.set(cacheKey, next(requestAdaptorData));
            }
            const responseAdaptorData = await requestCache.get(cacheKey);
            if (options?.cacheTime && responseAdaptorData) {
                responseCache.set(cacheKey, createResponseCacheData(responseAdaptorData));
            }
            return await requestCache.get(cacheKey);
        } finally {
            requestCache.delete(cacheKey);
        }
    };
};
