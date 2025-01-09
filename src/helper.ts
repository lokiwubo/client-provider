import { type AxiosRequestConfig, isAxiosError } from 'axios';
import type { AnyLike } from 'ts-utils-helper';
import type { DefineHttpClientOutput, RequestEventActionType, RequestOptions } from './types';

export function getErrorMessage(error: unknown, messageKey = 'message'): string {
    if (typeof error === 'string') {
        return error;
    }
    if (isAxiosError(error)) {
        const errorData = error.response?.data as Record<string, unknown> | undefined;
        const errorDataMessage = errorData?.[messageKey];
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

export const createHash = (data: AnyLike) => {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return `${hash.toString(32)}`;
};

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

export const getRequestAdaptorData = <
    TRequest extends AxiosRequestConfig,
    TOptions extends RequestOptions,
>(
    requestConfig: TRequest,
    options?: TOptions,
) => {
    return options?.requestAdaptor?.(requestConfig) ?? requestConfig;
};
/**
 * @description 请求配置类型
 */
export type RequestConfigType<T = AnyLike> = Omit<AxiosRequestConfig<T>, 'params' | 'data'> & {
    data: T;
};

export const getAdaptorData = <TPayload, TData, TOptions extends RequestOptions>(
    payload: TPayload,
    response: TData,
    request: RequestConfigType | AxiosRequestConfig,
    options?: TOptions,
) => {
    return options?.adaptor?.(payload, response, request) ?? response;
};
type RequestType = <
    TPayload,
    TRequest extends RequestConfigType<TPayload>,
    TConfig extends RequestOptions<TPayload, TResponse>,
    TResponse,
>(
    requestConfig: TRequest,
    config?: TConfig,
) => Promise<
    TConfig['adaptor'] extends undefined ? TResponse : ReturnType<NonNullable<TConfig['adaptor']>>
>;

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
