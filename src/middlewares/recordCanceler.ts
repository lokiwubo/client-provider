import type { Canceler } from 'axios';
import type { HttpClientMiddleware } from '../types';

const requestCache = {
    key: undefined as undefined | string,
};
export type RecordCanceler = {
    cancelFn: Canceler;
    path: string;
    method: string;
    payload: unknown;
    url: string;
};
const cacheCanceler = new Map<string, RecordCanceler>();
/**
 * @description 计入正在请求的CancelToken
 * @returns
 */
export const createRecordCancelTokenMiddleware = (cancelFn: Canceler): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        const requestUrl = requestConfig.url!;
        const cancelerKey = requestCache.key ?? requestUrl;
        try {
            const url = new URL(window.location.href);
            cacheCanceler.set(cancelerKey, {
                cancelFn,
                url: requestUrl,
                method: requestConfig.method!,
                payload: requestConfig.data,
                path: url.pathname,
            });
            setRecordCancelerKey(undefined);
            return await next(requestConfig);
        } finally {
            cacheCanceler.delete(cancelerKey);
        }
    };
};

export const getRecordCanceler = (key: string) => {
    return cacheCanceler.get(key);
};

export const setRecordCancelerKey = (key: string | undefined) => {
    requestCache.key = key;
};
