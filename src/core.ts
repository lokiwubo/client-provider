import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import type { AnyLike, FunctionLike } from 'ts-utils-helper';
import { asyncMiddleware } from 'ts-utils-helper';
import type { ClientResponseCacheData, RequestConfigType } from './helper';
import { createHash } from './helper';
import { createAdaptorMiddleware, createRequestAdaptorMiddleware } from './middlewares/adaptor';
import { createAxiosMethodDiffMiddleware } from './middlewares/axios';
import { createDelayMiddleware } from './middlewares/delay';
import {
    createErrorNoticeMiddleware,
    createLoadingMiddleware,
    createSuccessNoticeMiddleware,
} from './middlewares/notification';
import { createRetryMiddleware } from './middlewares/retry';
import { createTimeoutMiddleware } from './middlewares/timeout';
import type {
    HttpClientMiddleware,
    RequestEventActionType,
    RequestOptions,
    RequestXmlOptions,
} from './types';

/**
 * @description 支持中间件的HttpClient 后续可以扩展更多功能（比如缓存， 拦截器）
 * @description 前置拦截器 requestAdaptor （config: requestConfig, context）=>requestConfig
 * @description 后置拦截器 adaptor (payload, response, config, context) => response 处理后的返回结果
 */
export class HttpClient {
    private readonly _axios: AxiosInstance = axios.create();
    constructor(
        private eventAction: RequestEventActionType,
        private getMiddleWares?: () => HttpClientMiddleware[],
    ) {}
    private requestCache = new Map<string, Promise<AnyLike>>();
    private responseCache = new Map<string, ClientResponseCacheData<AnyLike>>();

    async request<
        TRequest extends RequestConfigType,
        TOption extends RequestOptions<TRequest['data'], AnyLike>,
        TAdaptor = TOption['adaptor'] extends FunctionLike
            ? ReturnType<TOption['adaptor']>
            : AxiosResponse<AnyLike, TRequest['data']>,
    >(requestConfig: TRequest, options?: TOption): Promise<TAdaptor> {
        const cacheKey = createHash(JSON.stringify(requestConfig));
        const { onSuccess, onFail, onStart, onFinish } = this.eventAction;
        const middlewares = [
            createAxiosMethodDiffMiddleware(),
            // 成功通知中间件
            createSuccessNoticeMiddleware(onSuccess, options),
            // 失败通知中间件
            createErrorNoticeMiddleware(onFail, options),
            // 加载通知中间件
            createLoadingMiddleware(onStart, onFinish, options),
            // 超时中间件
            createTimeoutMiddleware(options?.timeout),
            // 重试中间件
            createRetryMiddleware(options?.retry),
            // 延时中间件
            createDelayMiddleware(options?.delay),
            ...(this.getMiddleWares?.() ?? []),
            createRequestAdaptorMiddleware(
                cacheKey,
                this.requestCache,
                this.responseCache,
                options,
            ),
            createAdaptorMiddleware(options),
        ];

        return asyncMiddleware<AxiosRequestConfig, AnyLike>([
            ...middlewares,
            async (requestConfig) => {
                return await this._axios.request(requestConfig);
            },
        ])(requestConfig);
    }
    /**
     * @deprecated 废弃不建议使用 请使用 request 方法
     */
    async requestXml<TResponse>(
        requestConfig: AxiosRequestConfig,
        options: Partial<RequestXmlOptions> = {},
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
