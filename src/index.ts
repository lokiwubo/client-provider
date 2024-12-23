import { AnyLike } from 'ts-utils-helper';
import { HttpClient } from './core';
import { DefineHttpClient, HttpClientMiddleware, RequestTemplate } from './types';

const addMiddleware = (
    middleware: HttpClientMiddleware,
    container: Set<HttpClientMiddleware<AnyLike>>,
) => {
    container.add(middleware);
    return () => {
        container.delete(middleware);
    };
};
export const definedCreateHttpClient: DefineHttpClient = (context) => {
    const containerMiddlewaresSet = new Set<HttpClientMiddleware>([]);
    return Object.assign(
        <T extends RequestTemplate>(
            defineClientApis: (apis: HttpClient, context: AnyLike) => T,
        ) => {
            const scopeMiddlewaresSet = new Set<HttpClientMiddleware>([]);
            const httpClient = new HttpClient(() => [
                ...containerMiddlewaresSet,
                ...scopeMiddlewaresSet,
            ]);
            const clientApis = defineClientApis(httpClient, context);
            const apis = {
                use: (middleware: HttpClientMiddleware) =>
                    addMiddleware(middleware, scopeMiddlewaresSet),
            };
            return Object.assign(() => apis, clientApis);
        },
        {
            use: (middleware: HttpClientMiddleware) =>
                addMiddleware(middleware, containerMiddlewaresSet),
        },
    );
};
export * from './helper';
