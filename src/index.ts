import type { AnyLike } from 'ts-utils-helper';
import { HttpClient } from './core';
import type {
    ClientApis,
    ClientSubscribeEventLikeType,
    DefineHttpClient,
    ErrorNoticeContext,
    HttpClientMiddleware,
    RequestTemplateLike,
} from './types';
import { createDefinedOuPut, createRequestEventActions, isAsyncFunction } from './utils';

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
 * @returns
 */
export const definedCreateHttpClient: DefineHttpClient = (context, actions) => {
    // 全局中间件
    const containerMiddlewaresSet = new Set<HttpClientMiddleware>([]);
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
            defineClients: (httpClient: HttpClient, apis: ClientApis, context: AnyLike) => T,
        ) => {
            /**
             * @description 实例client 内部全局中间件
             */
            const globalMiddlewaresSet = new Set<HttpClientMiddleware>([]);
            /**
             * @description 和中间件不同的是针对对象不一样
             * subscribe 是针对执行对象的订阅
             */
            const scopeSubscribeSet = new Map<
                string,
                ClientSubscribeEventLikeType<AnyLike, AnyLike>[]
            >();
            const httpClient = new HttpClient(eventActions, () => [
                ...Array.from(containerMiddlewaresSet),
                ...Array.from(globalMiddlewaresSet),
            ]);
            const apis: ClientApis = {
                use: (middleware: HttpClientMiddleware) =>
                    addMiddleware(middleware, globalMiddlewaresSet),
                setPrefix: (prefix: string) => {
                    addMiddleware(async (requestConfig, next) => {
                        requestConfig.url = `${prefix}/${requestConfig.url}`.replace(
                            `${prefix}//`,
                            `${prefix}/`,
                        );
                        return next(requestConfig);
                    }, globalMiddlewaresSet);
                },
            };
            /**
             * @description 使用 clientApis 创建client实例
             * @param {T} httpClient 提供request 方法
             * @param {AnyLike} context 传递给client实例的上下文
             * @param {ClientApis} apis 提供中间件注册方法
             */
            const clientApis = defineClients(httpClient, apis, context);

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
                // 代理实例对象
                client: new Proxy(clientApis, {
                    get: (target, key: string) => {
                        const value = target[key];
                        if (typeof value === 'function') {
                            Object.assign(value, {
                                key: `${Date.now()}`,
                            });
                            return isAsyncFunction(value)
                                ? async (...args: AnyLike[]) => {
                                      try {
                                          const result = await Reflect.apply(value, target, args);
                                          runSubscribes(key, args, result);
                                          return result;
                                      } catch (e) {
                                          // 函数方法执行报错
                                          eventActions.onFail(null, null, e, 'request');
                                          throw e;
                                      }
                                  }
                                : (...args: AnyLike[]) => {
                                      try {
                                          const result = Reflect.apply(value, target, args);
                                          runSubscribes(key, args, result);
                                          return result;
                                      } catch (e) {
                                          // 函数方法执行报错
                                          eventActions.onFail(null, null, e, 'request');
                                          throw e;
                                      }
                                  };
                        }
                    },
                }),
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
        { context: context! },
    ) as AnyLike;
};
export * from './utils';
