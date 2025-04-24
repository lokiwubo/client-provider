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

export interface RequestOptions {
    /**成功时候展示信息 */
    successMessage?: string;
    /**错误时候展示 无则展示接口信息 */
    errorMessage?: string;
    /**
     * @default undefined
     * @param {boolean | undefined} visibleErrorMessage - 是否展示错误信息
     *   - `undefined`: 默认值 表示展示
     *   - `false`: 不展示
     *   - `true`: 展示
     * */
    visibleErrorMessage?: boolean;
    /**是否使用loading */
    showLoading?: boolean;
    /**设置接口超时时长 单位ms */
    timeOut?: number;
    /**设置接口缓存时长 单位ms */
    cacheTime?: number;
    /**
     * 设置接口参数默认过滤值
     * @param ('' | null | undefined | number)
     * @default ([])
     */
    filterEmptyValues?: ('' | null | undefined | number)[];
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
