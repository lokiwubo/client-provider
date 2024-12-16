import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AnyLike } from 'ts-utils-helper';

/**
 * @description 支持中间件的HttpClient 后续可以扩展更多功能（比如缓存， 拦截器）
 */
declare class HttpClient {
    private getMiddleWares?;
    private readonly _axios;
    private readonly _middleWares;
    constructor(getMiddleWares?: (() => HttpClientMiddleware[]) | undefined);
    request<TResponse>(requestConfig: AxiosRequestConfig): Promise<AxiosResponse<TResponse>>;
    requestXml<TResponse>(requestConfig: AxiosRequestConfig, progressCallback?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void): Promise<AxiosResponse<TResponse>>;
}

interface HttpClientMiddleware<T = AnyLike> {
    (requestConfig: AxiosRequestConfig, next: (requestConfig: AxiosRequestConfig) => Promise<T>): Promise<T>;
}
type UnBindMiddleware = () => void;
type CreatorTemplate<TContext> = TContext extends undefined ? (apis: HttpClient) => AnyLike : (apis: HttpClient, context: TContext) => AnyLike;
type DefineHttpClientOutput<TContext> = {
    use: (middleware: HttpClientMiddleware) => UnBindMiddleware;
    <TCreator extends CreatorTemplate<TContext>>(creator: TCreator): ReturnType<TCreator>;
};
interface DefineHttpClient {
    <TContext = undefined>(context?: TContext): DefineHttpClientOutput<TContext>;
}

declare const definedCreateHttpClient: DefineHttpClient;

export { definedCreateHttpClient };
