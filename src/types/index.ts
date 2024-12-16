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

type CreatorTemplate<TContext> = TContext extends undefined
  ? (apis: HttpClient) => AnyLike
  : (apis: HttpClient, context: TContext) => AnyLike;

type DefineHttpClientOutput<TContext> = {
  use: (middleware: HttpClientMiddleware) => UnBindMiddleware;
  <TCreator extends CreatorTemplate<TContext>>(creator: TCreator): ReturnType<TCreator>;
};

export interface DefineHttpClient {
  <TContext = undefined>(context?: TContext): DefineHttpClientOutput<TContext>;
}
