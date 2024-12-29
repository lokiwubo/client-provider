import { AxiosRequestConfig } from 'axios';
import { AnyLike, FunctionLike } from 'ts-utils-helper';
import { HttpClient } from '../core';

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

export interface RequestOptions<
    TPayload = AnyLike,
    TResponse = AnyLike,
    TAdaptor extends FunctionLike = Adaptor<TPayload, TResponse>,
> {
    cache?: number;
    requestAdaptor?: (config: AxiosRequestConfig) => AxiosRequestConfig;
    adaptor?: TAdaptor;
}

export interface RequestXmlOptions
    extends RequestOptions<AnyLike, AnyLike, Adaptor<AnyLike, AnyLike>> {
    onProgress?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void;
}
