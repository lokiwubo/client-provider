import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import type { AnyLike, FunctionLike } from 'ts-utils-helper';
import { asyncMiddleware, createHash } from 'ts-utils-helper';
import type { ClientResponseCacheData, RequestConfigType } from './helper';
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
import type { HttpClientMiddleware, RequestEventActionType, RequestOptions } from './types';

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

    request = async <
        TRequest extends RequestConfigType,
        TOption extends RequestOptions<TRequest['data'], AnyLike>,
        TAdaptor = TOption['adaptor'] extends FunctionLike
            ? ReturnType<TOption['adaptor']>
            : AxiosResponse<AnyLike, TRequest['data']>,
    >(
        requestConfig: TRequest,
        options?: TOption,
    ): Promise<TAdaptor> => {
        const cacheKey = createHash(JSON.stringify(requestConfig));
        const { onSuccess, onFail, onStart, onFinish } = this.eventAction;
        const cancelTokenSource = axios.CancelToken.source();
        requestConfig.cancelToken = cancelTokenSource.token;
        const middlewares = [
            createAxiosMethodDiffMiddleware(),
            // 成功通知中间件
            createSuccessNoticeMiddleware(onSuccess, options),
            // 失败通知中间件
            createErrorNoticeMiddleware(onFail, options),
            // 加载通知中间件
            createLoadingMiddleware(onStart, onFinish, options),
            // 超时中间件
            createTimeoutMiddleware(options?.timeout, cancelTokenSource.cancel),
            // 重试中间件
            createRetryMiddleware(options?.retry),
            // 延时中间件
            createDelayMiddleware(options?.delay),
            ...(this.getMiddleWares?.() ?? []),
            // 前置拦截器中间件
            createRequestAdaptorMiddleware(
                cacheKey,
                this.requestCache,
                this.responseCache,
                options,
            ),
            // 后置拦截器中间件
            createAdaptorMiddleware(options),
        ];

        return asyncMiddleware<AxiosRequestConfig, AnyLike>([
            ...middlewares,
            async (requestConfig) => {
                return await this._axios.request(requestConfig);
            },
        ])(requestConfig);
    };
}
