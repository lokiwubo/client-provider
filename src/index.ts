import type { AnyLike } from 'ts-utils-helper';
import { HttpClient } from './core';
import { createDefinedOuPut, createRequestEventActions } from './helper';
import type { ClientApis, DefineHttpClient, HttpClientMiddleware, RequestTemplate } from './types';

const addMiddleware = (
    middleware: HttpClientMiddleware,
    container: Set<HttpClientMiddleware<AnyLike>>,
) => {
    container.add(middleware);
    return () => {
        container.delete(middleware);
    };
};
/**
 * @typedef {import("./types/index").DefineHttpEventActionType} DefineHttpEventActionType
 */

/**
 * @param {any} context 可以传递到每个client 实例
 * @param {DefineHttpEventActionType } actions  自定义响应执行事件
 * @returns
 */
export const definedCreateHttpClient: DefineHttpClient = (context, actions) => {
    // 全局中间件
    const containerMiddlewaresSet = new Set<HttpClientMiddleware>([]);
    /**
     * TODO 添加请求并发数 和 请求的优先级
     */
    const globalParams = {
        _count: 0, // 私有属性来存储实际的 count 值
        get count() {
            return this._count;
        },
        set count(newCount: number) {
            if (newCount !== this._count) {
                if (this._count === 0 && newCount > 0) {
                    actions?.onLoading?.(true);
                } else if (this._count > 0 && newCount === 0) {
                    actions?.onLoading?.(false);
                }
                this._count = newCount;
            }
        },
    };

    const eventActions = createRequestEventActions({
        onFail: (_requestConfig, options, error) => {
            actions?.onErrorNotice?.(error, options?.errorMessage);
        },
        onSuccess: (_requestConfig, options) => {
            if (options?.successMessage) actions?.onSuccessNotice?.(options?.successMessage);
        },
        onStart: (_requestConfig, options) => {
            if (options?.showLoading) {
                globalParams.count++;
            }
        },
        onFinish: (_requestConfig, options) => {
            if (options?.showLoading) {
                globalParams.count--;
            }
        },
    });
    return Object.assign(
        <T extends RequestTemplate>(
            defineClients: (clients: HttpClient, context: AnyLike, apis: ClientApis) => T,
        ) => {
            // 自定义client 内部定义的中间件
            const scopeMiddlewaresSet = new Set<HttpClientMiddleware>([]);
            const httpClient = new HttpClient(eventActions, () => [
                ...containerMiddlewaresSet,
                ...scopeMiddlewaresSet,
            ]);
            const apis: ClientApis = {
                use: (middleware: HttpClientMiddleware) =>
                    addMiddleware(middleware, scopeMiddlewaresSet),
                setPrefix: (prefix: string) => {
                    addMiddleware(async (requestConfig, next) => {
                        // const url = requestConfig.url;
                        // requestConfig.url = `${prefix}/${url}`.replace(`${prefix}//`, `${prefix}/`);
                        requestConfig.baseURL = prefix;
                        return next(requestConfig);
                    }, scopeMiddlewaresSet);
                },
            };
            const clientApis = defineClients(httpClient, context, apis);
            return {
                ...apis,
                client: clientApis,
            };
        },
        createDefinedOuPut({
            use: (middleware: HttpClientMiddleware) =>
                addMiddleware(middleware, containerMiddlewaresSet),
        }),
    );
};
export * from './helper';

// export const createHttpClient = definedCreateHttpClient();
// const reportHttpClient = createHttpClient((apis) => {
//     return {
//         updateReport: async () => {
//             const data = await apis.request({
//                 url: '/report/update',
//                 data: { a: 1 },
//                 method: 'POST',
//             });
//             return data;
//         },
//     };
// });

// reportHttpClient.setPrefix('/inspection-report-admin-api');

// export const reportApi = reportHttpClient.client;
