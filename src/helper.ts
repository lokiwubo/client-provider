import { type AxiosRequestConfig, isAxiosError } from 'axios';
import { get } from 'lodash-es';
import type { AnyLike, IsNever, KeyPath, KeyPathValue, RecordLike } from 'ts-utils-helper';
import type { DefineHttpClientOutput, RequestEventActionType, RequestOptions } from './types';

/**
 *
 * @param  {string} error 错误对象
 * @param  {string } messagePath 错误对应的keyPath
 * @example
 * getErrorMessage({ message: 'error message' }) // 'error message'
 * const message = getErrorMessage({ response: { data: { message: 'error message' } } }, "response.data.message")  // 'error message'
 */

export function getErrorMessage<
    const T,
    TPath extends KeyPath<T extends RecordLike ? T : {}> & string,
    TRequest = KeyPathValue<T extends RecordLike ? T : {}, TPath>,
>(
    error: T,
    messagePath: TPath = 'message' as TPath,
): IsNever<TRequest> extends true ? string : TRequest {
    if (typeof error === 'string') {
        return error as AnyLike;
    }
    if (isAxiosError(error)) {
        const errorData = error.response?.data as Record<string, unknown> | undefined;
        const errorDataMessage = get(errorData, messagePath, undefined) || error.message;
        if (errorDataMessage && typeof errorDataMessage === 'string') {
            return errorDataMessage as AnyLike;
        }
    }

    if (error instanceof Error) {
        return error.message as AnyLike;
    }

    try {
        return JSON.stringify(error, undefined, 2) as AnyLike;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
        return ('' + error) as AnyLike;
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
