export class DataAccessError extends Error {
    public constructor(message?: string) {
        super(message)
    }
}