import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { asyncMiddleware } from 'ts-utils-helper';
import { HttpClientMiddleware } from './types';

/**
 * @description 支持中间件的HttpClient 后续可以扩展更多功能（比如缓存， 拦截器）
 */
export class HttpClient {
  private readonly _axios: AxiosInstance = axios.create();
  private readonly _middleWares: HttpClientMiddleware[] = [];
  constructor(private getMiddleWares?: () => HttpClientMiddleware[]) {}
  async request<TResponse>(requestConfig: AxiosRequestConfig): Promise<AxiosResponse<TResponse>> {
    return asyncMiddleware<AxiosRequestConfig, AxiosResponse<TResponse>>([
      ...(this.getMiddleWares?.() ?? []),
      async (requestConfig) => {
        return await this._axios.request(requestConfig);
      },
    ])(requestConfig);
  }
  async requestXml<TResponse>(
    requestConfig: AxiosRequestConfig,
    progressCallback?: (event: ProgressEvent<XMLHttpRequestEventTarget>) => void,
  ): Promise<AxiosResponse<TResponse>> {
    return asyncMiddleware<AxiosRequestConfig, AxiosResponse<TResponse>>([
      ...this._middleWares,
      async (requestConfig) => {
        return await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.response));
            } else {
              reject(new Error(`Request failed with status ${xhr.status}`));
            }
          };
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              progressCallback?.(event);
            }
          });
          xhr.onerror = () => {
            reject(new Error('Network error.'));
          };
          xhr.open(requestConfig.method || 'GET', requestConfig.url!);
          if (requestConfig.headers) {
            for (const key in requestConfig.headers) {
              if (Object.prototype.hasOwnProperty.call(requestConfig.headers, key)) {
                xhr.setRequestHeader(key, requestConfig.headers[key]);
              }
            }
          }
          xhr.send(requestConfig.data);
        });
      },
    ])(requestConfig);
  }
}
