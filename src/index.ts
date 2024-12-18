import { AnyLike } from 'ts-utils-helper';
import { HttpClient } from './core';
import { DefineHttpClient, HttpClientMiddleware, RequestTemplate } from './types';

export const definedCreateHttpClient: DefineHttpClient = (context) => {
    const middlewaresSet = new Set<HttpClientMiddleware>([]);
    const httpClient = new HttpClient(() => [...middlewaresSet]);
    return Object.assign(
        <T extends RequestTemplate>(defineApis: (apis: HttpClient, context: AnyLike) => T) => {
            return defineApis(httpClient, context);
        },
        {
            use: (middleware: HttpClientMiddleware) => {
                middlewaresSet.add(middleware);
                return () => {
                    middlewaresSet.delete(middleware);
                };
            },
        },
    );
};
