import { AxiosRequestConfig } from 'axios';
import { AnyLike } from 'ts-utils-helper';
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
