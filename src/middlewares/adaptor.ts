import type { AnyLike } from 'ts-utils-helper';
import type { ClientResponseCacheData } from '../helper';
import { createResponseCacheData, getAdaptorData, getRequestAdaptorData } from '../helper';
import type { HttpClientMiddleware, RequestOptions } from '../types';

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
        const requestAdaptorData = getRequestAdaptorData(requestConfig, options);
        const cacheResponse = responseCache.get(cacheKey);
        //缓存命中
        if (
            cacheResponse &&
            options?.cache &&
            Date.now() - cacheResponse.updateAt < options.cache
        ) {
            return cacheResponse.data;
        }
        // 请求去重 并缓存请求
        try {
            if (!requestCache.has(cacheKey)) {
                requestCache.set(cacheKey, next(requestAdaptorData));
            }
            const responseAdaptorData = await requestCache.get(cacheKey);
            if (options?.cache && responseAdaptorData) {
                responseCache.set(cacheKey, createResponseCacheData(responseAdaptorData));
            }
            return await requestCache.get(cacheKey);
        } finally {
            requestCache.delete(cacheKey);
        }
    };
};

/**
 * @description 后置拦截器 处理响应数据转换
 */
export const createAdaptorMiddleware = (options?: RequestOptions): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        const responseAdaptorData = getAdaptorData(
            requestConfig.method === 'GET' ? requestConfig.params : requestConfig.data, //payload
            await next(requestConfig), //response
            requestConfig, //requestConfig
            options, //配置项
        );
        return responseAdaptorData;
    };
};
