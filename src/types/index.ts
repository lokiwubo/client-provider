import type { AxiosRequestConfig } from 'axios';
import type { AnyLike, FunctionLike, PromiseFunctionLike } from 'ts-utils-helper';
import type { HttpClient } from '../core';

export interface HttpClientMiddleware<T = AnyLike> {
    (
        requestConfig: AxiosRequestConfig,
        next: (requestConfig: AxiosRequestConfig) => Promise<T>,
    ): Promise<T>;
}
export interface RequestTemplateLike {
    [key: string]: (...args: AnyLike[]) => AnyLike;
}
type UnBindMiddleware = () => void;
type UnSubscribeType = () => void;

export interface ClientApis {
    use: (middleware: HttpClientMiddleware) => UnBindMiddleware;
    setPrefix: (prefix: string) => void;
}

type CreatorTemplateLike<TContext> = TContext extends undefined
    ? (clients: HttpClient, apis: ClientApis) => AnyLike
    : (clients: HttpClient, apis: ClientApis, context: TContext) => AnyLike;

type FunctionWithKey<T extends FunctionLike> = {
    key: string;
} & T;

type PickFunctionWithKey<T extends Record<string, FunctionLike>> = {
    [TKey in keyof T]: T[TKey] extends FunctionLike ? FunctionWithKey<T[TKey]> : T[TKey];
};

export type ClientSubscribeEventLikeType<TPayload, TResponse> = (
    payload: TPayload,
    response: TResponse,
) => void;

export type ClientSubscribeType<T extends Record<string, FunctionLike>> = <TName extends keyof T>(
    actionName: TName,
    event: (
        payload: Parameters<T[TName]>,
        response: T[TName] extends PromiseFunctionLike
            ? Awaited<ReturnType<T[TName]>>
            : ReturnType<T[TName]>,
    ) => void,
) => UnSubscribeType;

export type DefineHttpClientOutput<TContext> = {
    useGlobal: (middleware: HttpClientMiddleware) => UnBindMiddleware;
    setBaseURL: (baseURL: string) => void;
    <
        TCreator extends CreatorTemplateLike<TContext>,
        TClient = PickFunctionWithKey<ReturnType<TCreator>>,
    >(
        creator: TCreator,
    ): {
        client: TClient;
        subscribe: ClientSubscribeType<{
            [TName in keyof TClient]: TClient[TName] extends FunctionLike ? TClient[TName] : never;
        }>;
    } & ClientApis;
    context: TContext;
};

export type ErrorNoticeContext =
    | {
          requestConfig: AxiosRequestConfig;
          options: RequestOptions;
          msg?: string;
          from: 'response';
      }
    | {
          requestConfig: null;
          options: null;
          msg?: string;
          from: 'request';
      };

export type DefineHttpEventActionType = {
    onSuccessNotice: (msg: string) => void;
    onErrorNotice: (error: unknown, context: ErrorNoticeContext) => void;
    onLoading: (isVisible: boolean, loadingCount: number) => void;
};

export interface DefineHttpClient {
    <TActions extends DefineHttpEventActionType, const TContext = undefined>(
        context?: TContext,
        action?: Partial<TActions>,
    ): DefineHttpClientOutput<TContext>;
}
type Adaptor<TPayload, TResponse> = (
    payload: TPayload,
    response: TResponse,
    config: AxiosRequestConfig,
) => AnyLike;
export interface RequestOptions<TPayload = AnyLike, TResponse = AnyLike> {
    cache?: number;
    requestAdaptor?: (config: AxiosRequestConfig) => AxiosRequestConfig;
    adaptor?: Adaptor<TPayload, TResponse>;
    /**
     * 单位 ms 控制请求超时
     */
    timeout?: number; // 单位 ms
    /**
     * 错误后的重试次数
     */
    retry?: number; // 重试次数
    /**
     * delay 单位 ms 控制请求间隔
     * 延迟请求，防止请求过于频繁
     */
    delay?: number;
    /**成功时候展示信息 */
    successMessage?: string;
    /**错误时候展示 */
    errorMessage?: string;
    /**是否使用loading */
    showLoading?: boolean;
}

export interface RequestEventActionType {
    onSuccess: (
        requestConfig: AxiosRequestConfig,
        options: RequestOptions | undefined,
        responseData: unknown,
    ) => void;
    onFail: (
        requestConfig: AxiosRequestConfig | null,
        options: RequestOptions | null,
        error: unknown,
        from: 'request' | 'response',
    ) => void;
    onStart: (requestConfig: AxiosRequestConfig, options?: RequestOptions) => void;
    onFinish: (requestConfig: AxiosRequestConfig, options?: RequestOptions) => void;
}
