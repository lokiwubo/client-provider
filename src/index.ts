import { AnyLike } from 'ts-utils-helper';
import { HttpClient } from './core';
import { ClientApis, DefineHttpClient, HttpClientMiddleware, RequestTemplate } from './types';

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
            defineClients: (clients: HttpClient, context: AnyLike, apis: ClientApis) => T,
        ) => {
            const scopeMiddlewaresSet = new Set<HttpClientMiddleware>([]);
            const httpClient = new HttpClient(() => [
                ...containerMiddlewaresSet,
                ...scopeMiddlewaresSet,
            ]);
            const apis: ClientApis = {
                use: (middleware: HttpClientMiddleware) =>
                    addMiddleware(middleware, scopeMiddlewaresSet),
                setPrefix: (prefix: string) => {
                    addMiddleware(async (requestConfig, next) => {
                        const url = requestConfig.url;
                        requestConfig.url = `${prefix}/${url}`.replace(`${prefix}//`, `${prefix}/`);
                        return next(requestConfig);
                    }, scopeMiddlewaresSet);
                },
            };
            const clientApis = defineClients(httpClient, context, apis);
            return {
                ...apis,
                client: clientApis,
            };
        },
        {
            use: (middleware: HttpClientMiddleware) =>
                addMiddleware(middleware, containerMiddlewaresSet),
        },
    );
};
export * from './helper';
