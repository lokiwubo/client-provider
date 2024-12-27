import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AnyLike, asyncMiddleware } from 'ts-utils-helper';
import { ClientResponseCacheData, createHash, definedRequest } from './helper';
import { createAdaptorMiddleware, createRequestAdaptorMiddleware } from './middlewares/adaptor';
import { createAxiosMethodDiffMiddleware } from './middlewares/axios';
import { HttpClientMiddleware, RequestXmlOptions } from './types';

/**
 * @description 支持中间件的HttpClient 后续可以扩展更多功能（比如缓存， 拦截器）
 * @description 前置拦截器 requestAdaptor （config: requestConfig, context）=>requestConfig
 * @description 后置拦截器 adaptor (payload, response, config, context) => response 处理后的返回结果
 */

export class HttpClient {
    private readonly _axios: AxiosInstance = axios.create();
    constructor(private getMiddleWares?: () => HttpClientMiddleware[]) {}
    private requestCache = new Map<string, Promise<AnyLike>>();
    private responseCache = new Map<string, ClientResponseCacheData<AnyLike>>();
    public request = definedRequest(async (requestConfig, config) => {
        const cacheKey = createHash(JSON.stringify(requestConfig));
        return asyncMiddleware<AxiosRequestConfig, AnyLike>([
            createAxiosMethodDiffMiddleware(),
            ...(this.getMiddleWares?.() ?? []),
            createRequestAdaptorMiddleware(cacheKey, this.requestCache, this.responseCache, config),
            createAdaptorMiddleware(config),
            async (requestConfig) => {
                return await this._axios.request(requestConfig);
            },
        ])(requestConfig);
    });

    /**
     * @deprecated 废弃不建议使用 请使用 request 方法
     */
    async requestXml<TResponse>(
        requestConfig: AxiosRequestConfig,
        options: RequestXmlOptions = {},
    ): Promise<AxiosResponse<TResponse>> {
        return asyncMiddleware<AxiosRequestConfig, AxiosResponse<TResponse>>([
            ...(this.getMiddleWares?.() ?? []),
            async (requestConfig) => {
                return await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.onload = ((
                        _target: XMLHttpRequest,
                        event: ProgressEvent<XMLHttpRequestEventTarget>,
                    ) => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(JSON.parse(xhr.response));
                            options.onProgress?.(event);
                        } else {
                            reject(new Error(`Request failed with status ${xhr.status}`));
                        }
                    }) as AnyLike;
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            options.onProgress?.(event);
                        }
                    });
                    xhr.onerror = () => {
                        reject(new Error('Network error.'));
                    };
                    xhr.open(requestConfig.method || 'GET', requestConfig.url!);

                    if (requestConfig.headers) {
                        for (const key in requestConfig.headers) {
                            if (Object.prototype.hasOwnProperty.call(requestConfig.headers, key)) {
                                xhr.setRequestHeader(key, requestConfig.headers[key]);
                            }
                        }
                    }
                    xhr.send(requestConfig.data);
                });
            },
        ])(requestConfig);
    }
}
