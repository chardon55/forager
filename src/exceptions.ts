export class DataAccessError extends Error {
    public constructor(message?: string) {
        super(message)
    }
}

export class RequestFailedError extends DataAccessError {
    public constructor(message?: string) {
        super(message)
    }
}