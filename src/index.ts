import { isAsyncFunction, type AnyLike } from 'ts-utils-helper';
import { HttpClient } from './core';
import { createDefinedOuPut, createRequestEventActions } from './helper';
import type {
    ClientApis,
    ClientSubscribeEventLikeType,
    DefineHttpClient,
    ErrorNoticeContext,
    HttpClientMiddleware,
    RequestTemplateLike,
} from './types';

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
 * @param {any} context 可以传递到每个client 实例
 * @param {import('./types').DefineHttpEventActionType } actions  自定义响应执行事件
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
                    actions?.onLoading?.(true, newCount);
                } else if (this._count > 0 && newCount === 0) {
                    actions?.onLoading?.(false, newCount);
                }
                this._count = newCount;
            }
        },
    };

    const eventActions = createRequestEventActions({
        onFail: (requestConfig, options, error, from) => {
            actions?.onErrorNotice?.(error, {
                msg: options?.errorMessage,
                requestConfig: requestConfig,
                options,
                from,
            } as ErrorNoticeContext);
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
        <T extends RequestTemplateLike>(
            defineClients: (clients: HttpClient, context: AnyLike, apis: ClientApis) => T,
        ) => {
            // 自定义client 内部定义的中间件
            const scopeMiddlewaresSet = new Set<HttpClientMiddleware>([]);
            const scopeSubscribeSet = new Map<
                string,
                ClientSubscribeEventLikeType<AnyLike, AnyLike>[]
            >();
            const httpClient = new HttpClient(eventActions, () => [
                ...Array.from(containerMiddlewaresSet),
                ...Array.from(scopeMiddlewaresSet),
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
            const runSubscribes = async (key: string, payload: AnyLike, response: AnyLike) => {
                try {
                    const subscribe = scopeSubscribeSet.get(key);
                    if (subscribe && Array.isArray(subscribe)) {
                        subscribe.forEach((fn) => fn(payload, response));
                    }
                } catch (e) {
                    console.error(e);
                }
            };
            return {
                ...apis,
                client: Object.fromEntries(
                    Object.entries(clientApis).map((item) => {
                        const [key, value] = item;
                        if (typeof value === 'function') {
                            Object.assign(value, {
                                key: `${Date.now()}`,
                            });
                            return [
                                key,
                                isAsyncFunction(value)
                                    ? async (...args: AnyLike[]) => {
                                          try {
                                              const result = await Reflect.apply(
                                                  value,
                                                  clientApis,
                                                  args,
                                              );
                                              runSubscribes(key, args, result);
                                              return result;
                                          } catch (e) {
                                              eventActions.onFail(null, null, e, 'request');
                                              throw e;
                                          }
                                      }
                                    : (...args: AnyLike[]) => {
                                          try {
                                              const result = Reflect.apply(value, clientApis, args);
                                              runSubscribes(key, args, result);
                                              return result;
                                          } catch (e) {
                                              eventActions.onFail(null, null, e, 'request');
                                              throw e;
                                          }
                                      },
                            ];
                        }
                        return item;
                    }),
                ),
                subscribe: (
                    key: AnyLike,
                    event: ClientSubscribeEventLikeType<AnyLike, AnyLike>,
                ) => {
                    if (typeof event !== 'function') {
                        throw new Error('event must be a function');
                    }
                    scopeSubscribeSet.set(key, [...(scopeSubscribeSet.get(key) || []), event]);
                    return () => {
                        scopeSubscribeSet.set(
                            key,
                            (scopeSubscribeSet.get(key) || []).filter((fn) => fn !== event),
                        );
                    };
                },
                // clientApis,
            };
        },
        createDefinedOuPut({
            useGlobal: (middleware: HttpClientMiddleware) =>
                addMiddleware(middleware, containerMiddlewaresSet),
            setBaseURL: (baseURL: string) => {
                addMiddleware(async (requestConfig, next) => {
                    requestConfig.baseURL = baseURL;
                    return next(requestConfig);
                }, containerMiddlewaresSet);
            },
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
