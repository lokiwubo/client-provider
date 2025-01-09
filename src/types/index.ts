import type { AxiosRequestConfig } from 'axios';
import type { AnyLike } from 'ts-utils-helper';
import type { HttpClient } from '../core';

export interface HttpClientMiddleware<T = AnyLike> {
    (
        requestConfig: AxiosRequestConfig,
        next: (requestConfig: AxiosRequestConfig) => Promise<T>,
    ): Promise<T>;
}
export interface RequestTemplate {
    [key: string]: Record<string, (...args: AnyLike[]) => AnyLike>;
}
type UnBindMiddleware = () => void;

export interface ClientApis {
    use: (middleware: HttpClientMiddleware) => UnBindMiddleware;
    setPrefix: (prefix: string) => void;
}

type CreatorTemplate<TContext> = TContext extends undefined
    ? (clients: HttpClient, apis: ClientApis) => AnyLike
    : (clients: HttpClient, context: TContext, apis: ClientApis) => AnyLike;

export type DefineHttpClientOutput<TContext> = {
    use: (middleware: HttpClientMiddleware) => UnBindMiddleware;
    <TCreator extends CreatorTemplate<TContext>>(
        creator: TCreator,
    ): { client: ReturnType<TCreator> } & ClientApis;
};
export type DefineHttpEventActionType = {
    onSuccessNotice: (msg: string) => void;
    onErrorNotice: (error: unknown, msg?: string) => void;
    onLoading: (isVisible: boolean) => void;
};

export interface DefineHttpClient {
    <TActions extends Partial<DefineHttpEventActionType>, TContext = undefined>(
        context?: TContext,
        action?: TActions,
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

export interface RequestXmlOptions extends RequestOptions<AnyLike, AnyLike> {
    onProgress?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
}

export interface RequestEventActionType {
    onSuccess: (
        requestConfig: AxiosRequestConfig,
        options: RequestOptions | undefined,
        responseData: unknown,
    ) => void;
    onFail: (
        requestConfig: AxiosRequestConfig,
        options: RequestOptions | undefined,
        error: unknown,
    ) => void;
    onStart: (requestConfig: AxiosRequestConfig, options?: RequestOptions) => void;
    onFinish: (requestConfig: AxiosRequestConfig, options?: RequestOptions) => void;
}
