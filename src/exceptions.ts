export class DataAccessError extends Error {
    public constructor(message?: string) {
        super(message)
    }
}

export class RequestFailedError extends DataAccessError {
    private statusCode: number

    public get StatusCode() {
        return this.statusCode
    }

    public constructor(statusCode?: number, message?: string) {
        super(message)
        this.statusCode = statusCode
    }
}