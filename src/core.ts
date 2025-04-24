import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import type { ClientResponseCacheData } from './utils';
import { asyncMiddleware, type RequestConfigType } from './utils';

import { createAxiosMethodDiffMiddleware } from './middlewares/axios';

import {
    createErrorNoticeMiddleware,
    createLoadingMiddleware,
    createSuccessNoticeMiddleware,
} from './middlewares/notification';

import get from 'lodash-es/get';
import type { AnyLike } from 'ts-utils-helper';
import { createHash } from 'ts-utils-helper';
import { createRequestAdaptorMiddleware } from './middlewares/adaptor';
import { createRecordCancelTokenMiddleware } from './middlewares/recordCanceler';
import { createTimeoutMiddleware } from './middlewares/timeout';
import type { HttpClientMiddleware, RequestEventActionType, RequestOptions } from './types';

export class HttpClient {
    private readonly _axios: AxiosInstance = axios.create();
    constructor(
        private eventAction: RequestEventActionType,
        private getMiddleWares?: () => HttpClientMiddleware[],
    ) {}
    private requestCache = new Map<string, Promise<AnyLike>>();
    private responseCache = new Map<string, ClientResponseCacheData<AnyLike>>();
    request = async <
        TResponse,
        TRequest extends RequestConfigType = RequestConfigType,
        TOption extends RequestOptions = RequestOptions,
    >(
        requestConfig: TRequest,
        options?: TOption,
    ): Promise<AxiosResponse<TResponse, TRequest['data']>> => {
        const { onSuccess, onFail, onStart, onFinish } = this.eventAction;
        const cancelTokenSource = axios.CancelToken.source();
        requestConfig.cancelToken = cancelTokenSource.token;
        const cacheKey = createHash(JSON.stringify(requestConfig));
        const middlewares = [
            // 超时中间件
            createTimeoutMiddleware(options?.timeOut, cancelTokenSource.cancel),
            createAxiosMethodDiffMiddleware(options),
            createSuccessNoticeMiddleware(onSuccess, options),
            createErrorNoticeMiddleware(onFail, options),
            createLoadingMiddleware(onStart, onFinish, options),
            createRecordCancelTokenMiddleware(cancelTokenSource.cancel),
            createRequestAdaptorMiddleware(
                cacheKey,
                this.requestCache,
                this.responseCache,
                options,
            ),
            ...(this.getMiddleWares?.() ?? []),
        ];

        return asyncMiddleware<AxiosRequestConfig, AnyLike>([
            ...middlewares,
            async (requestConfig) => {
                requestConfig.url = get(requestConfig, 'url', '')
                    .replace('//', '/')
                    .replace(/\/$/, '');
                const response = await this._axios.request(requestConfig);
                return response;
            },
        ])(requestConfig);
    };
}
