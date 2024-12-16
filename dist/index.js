'use strict';

var axios = require('axios');
var tsUtilsHelper = require('ts-utils-helper');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

/**
 * @description 支持中间件的HttpClient 后续可以扩展更多功能（比如缓存， 拦截器）
 */
var HttpClient = /** @class */ (function () {
    function HttpClient(getMiddleWares) {
        this.getMiddleWares = getMiddleWares;
        this._axios = axios.create();
        this._middleWares = [];
    }
    HttpClient.prototype.request = function (requestConfig) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                return [2 /*return*/, tsUtilsHelper.asyncMiddleware(__spreadArray(__spreadArray([], __read(((_b = (_a = this.getMiddleWares) === null || _a === void 0 ? void 0 : _a.call(this)) !== null && _b !== void 0 ? _b : [])), false), [
                        function (requestConfig) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this._axios.request(requestConfig)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); },
                    ], false))(requestConfig)];
            });
        });
    };
    HttpClient.prototype.requestXml = function (requestConfig, progressCallback) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, tsUtilsHelper.asyncMiddleware(__spreadArray(__spreadArray([], __read(this._middleWares), false), [
                        function (requestConfig) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                                            var xhr = new XMLHttpRequest();
                                            xhr.onload = function () {
                                                if (xhr.status >= 200 && xhr.status < 300) {
                                                    resolve(JSON.parse(xhr.response));
                                                }
                                                else {
                                                    reject(new Error("Request failed with status ".concat(xhr.status)));
                                                }
                                            };
                                            xhr.upload.addEventListener('progress', function (event) {
                                                if (event.lengthComputable) {
                                                    progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(event);
                                                }
                                            });
                                            xhr.onerror = function () {
                                                reject(new Error('Network error.'));
                                            };
                                            xhr.open(requestConfig.method || 'GET', requestConfig.url);
                                            if (requestConfig.headers) {
                                                for (var key in requestConfig.headers) {
                                                    if (Object.prototype.hasOwnProperty.call(requestConfig.headers, key)) {
                                                        xhr.setRequestHeader(key, requestConfig.headers[key]);
                                                    }
                                                }
                                            }
                                            xhr.send(requestConfig.data);
                                        })];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); },
                    ], false))(requestConfig)];
            });
        });
    };
    return HttpClient;
}());

var definedCreateHttpClient = function (context) {
    var middlewaresSet = new Set([]);
    var httpClient = new HttpClient(function () { return __spreadArray([], __read(middlewaresSet), false); });
    return Object.assign({
        use: function (middleware) {
            middlewaresSet.add(middleware);
            return function () {
                middlewaresSet.delete(middleware);
            };
        },
        createClient: function (defineApis) {
            return defineApis(httpClient, context);
        },
    });
};

exports.definedCreateHttpClient = definedCreateHttpClient;
