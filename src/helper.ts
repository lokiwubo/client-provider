import { isAxiosError } from 'axios';

export function getErrorMessage(error: unknown, messageKey = 'message'): string {
    if (typeof error === 'string') {
        return error;
    }

    if (isAxiosError(error)) {
        const errorData = error.response?.data as Record<string, unknown> | undefined;
        const errorDataMessage = errorData?.[messageKey];
        if (typeof errorDataMessage === 'string') {
            return errorDataMessage;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    try {
        return JSON.stringify(error, undefined, 2);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
        return '' + error;
    }
}
