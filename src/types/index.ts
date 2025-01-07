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

type DefineHttpClientOutput<TContext> = {
    use: (middleware: HttpClientMiddleware) => UnBindMiddleware;
    <TCreator extends CreatorTemplate<TContext>>(
        creator: TCreator,
    ): { client: ReturnType<TCreator> } & ClientApis;
};

export interface DefineHttpClient {
    <TContext = undefined>(context?: TContext): DefineHttpClientOutput<TContext>;
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
}

export interface RequestXmlOptions extends RequestOptions<AnyLike, AnyLike> {
    onProgress?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
}
