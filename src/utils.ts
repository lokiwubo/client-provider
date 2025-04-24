import { type AxiosRequestConfig, isAxiosError } from 'axios';
import get from 'lodash-es/get';
import type {
    AnyLike,
    AsyncMiddlewareFunType,
    FunctionLike,
    PromiseFunctionLike,
} from 'ts-utils-helper';
import { TimeoutError } from 'ts-utils-helper';
import type { DefineHttpClientOutput, RequestEventActionType, RequestOptions } from './types';

export function getErrorMessage(error: unknown, messageKey = 'message'): string {
    if (typeof error === 'string') {
        return error;
    }
    if (isAxiosError(error)) {
        const errorData = error.response?.data as Record<string, unknown> | undefined;
        const errorDataMessage = get(errorData, messageKey, '') || error.message;
        if (typeof errorDataMessage === 'string') {
            return errorDataMessage;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    try {
        return JSON.stringify(error, undefined, 2);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
        return '' + error;
    }
}

export type ClientResponseCacheData<T> = {
    data: T;
    updateAt: number;
};
export const createResponseCacheData = <T>(data: T): ClientResponseCacheData<T> => {
    return {
        data,
        updateAt: Date.now(),
    };
};

/**
 * @description 请求配置类型
 */
type HttpMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
export type RequestConfigType<T = AnyLike> = Omit<
    AxiosRequestConfig<T>,
    'params' | 'data' | 'method'
> & {
    data?: T;
    method: HttpMethods | Lowercase<HttpMethods>;
};

type RequestType = <
    TPayload,
    TRequest extends RequestConfigType<TPayload>,
    TConfig extends RequestOptions,
    TResponse,
>(
    requestConfig: TRequest,
    config?: TConfig,
) => Promise<TResponse>;

export const definedRequest = <T extends RequestType>(request: T): T => {
    return request;
};

export const createRequestEventActions = <TEvent extends RequestEventActionType>(events: TEvent) =>
    events;

export const createDefinedOuPut = <TConfig extends Partial<DefineHttpClientOutput<AnyLike>>>(
    config: TConfig,
) => {
    return config;
};

export function isValidateNumber(value: unknown): value is number {
    // 检查值是否为NaN
    if (typeof value !== 'number') {
        return false;
    }
    if (Number.isNaN(value)) {
        return false;
    }
    // 检查值是否为有限数字
    if (!Number.isFinite(value)) {
        return false;
    }
    return true;
}

export const timeoutPromise = async <T extends () => Promise<T>>(
    asyncFn: () => Promise<T>,
    time: number,
) => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new TimeoutError('Promise timed out'));
        }, time);
        asyncFn()
            .then((result) => {
                clearTimeout(timeoutId);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
    });
};

export function asyncMiddleware<TContext, TResponse = void>(
    funcs: AsyncMiddlewareFunType<TContext, TResponse>[],
) {
    return funcs.reverse().reduce<(param: TContext) => Promise<TResponse>>(
        (result, next) => (arg) => Promise.resolve(next(arg, result)),
        () => Promise.resolve() as Promise<TResponse>,
    );
}

export function isAsyncFunction(value: FunctionLike): value is PromiseFunctionLike {
    return Object.prototype.toString.call(value) === '[object AsyncFunction]';
}
