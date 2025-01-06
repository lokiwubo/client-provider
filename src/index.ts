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
    /**
     * 添加请求并发数 和 请求的优先级
     */
    // const requestList = new Set<RequestTemplate>();  //
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

// export const createHttpClient = definedCreateHttpClient();
// const reportHttpClient = createHttpClient((apis) => {
//     return {
//         updateReport: async () => {
//             const { data } = await apis.request<{ b: string }, { a: string }>({
//                 url: '/report/update',
//                 data: Object.assign({}),
//                 method: 'POST',
//             });
//             return data;
//         },
//     };
// });

// reportHttpClient.setPrefix('/inspection-report-admin-api');

// export const reportApi = reportHttpClient.client;
