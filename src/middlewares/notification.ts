import type { HttpClientMiddleware, RequestEventActionType, RequestOptions } from '../types';

/**
 * @description 用来提示请求成功时候消息提示
 */
export const createSuccessNoticeMiddleware = (
    feedbackAction: RequestEventActionType['onSuccess'],
    options?: RequestOptions,
): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        const res = await next(requestConfig);
        if (options?.successMessage) {
            feedbackAction(requestConfig, options, res);
        }
        return res;
    };
};
/**
 * @description 用来提示请求失败时候消息提示
 */
export const createErrorNoticeMiddleware = (
    feedbackAction: RequestEventActionType['onFail'],
    options?: RequestOptions,
): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        try {
            return await next(requestConfig);
        } catch (error) {
            feedbackAction(requestConfig, options, error);
        }
    };
};

/**
 * @description 创建加载状态中间件
 */
export const createLoadingMiddleware = (
    startAction: RequestEventActionType['onStart'],
    finishAction: RequestEventActionType['onFinish'],
    options?: RequestOptions,
): HttpClientMiddleware => {
    return async (requestConfig, next) => {
        try {
            startAction(requestConfig, options);
            return await next(requestConfig);
        } finally {
            finishAction(requestConfig, options);
        }
    };
};
