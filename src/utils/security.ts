import * as jwt from 'jsonwebtoken'

export interface IEncryptor {
    encrypt(content: any): string

    decrypt(cipher: string): any
}

export class JwtEncryptor implements IEncryptor {

    private key = "caerwoariuewatawegg"

    public encrypt(content: string | object | Buffer): string {
        return jwt.sign(content, this.key)
    }

    public decrypt(cipher: string): string | jwt.JwtPayload {
        return jwt.verify(cipher, this.key)
    }

    public constructor(key?: string) {
        if (!!key) {
            this.key = key
        }
    }
}

export type AsymmeticAlgorithm =
    "RS256" | "RS384" | "RS512" |
    "ES256" | "ES384" | "ES512"

export class JwtAsymmetricEncryptor implements IEncryptor {
    private privateKey: string = null
    private publicKey: string = null

    private algorithm: AsymmeticAlgorithm = 'RS512'

    public get Algorithm(): AsymmeticAlgorithm {
        return this.algorithm
    }

    public set Algorithm(alg: AsymmeticAlgorithm) {
        this.algorithm = alg
    }

    public encrypt(content: string | object | Buffer): string {
        if (!this.privateKey) {
            throw new PrivateKeyUnknownError()
        }

        return jwt.sign(content, this.privateKey, {
            algorithm: this.algorithm,
        })
    }

    public decrypt(cipher: string): string | jwt.JwtPayload {
        if (!this.publicKey) {
            throw new PublicKeyUnknownError()
        }

        return jwt.verify(cipher, this.publicKey, {
            algorithms: [
                this.algorithm,
            ]
        })
    }

    public constructor({
        privateKey = "",
        publicKey = ""
    } = {}) {
        if (!!privateKey) {
            this.privateKey = privateKey
        }

        if (!!publicKey) {
            this.publicKey = publicKey
        }
    }
}

class InvalidPublicKeyError extends Error {

}

class InvalidPrivateKeyError extends Error {

}

class PublicKeyUnknownError extends InvalidPublicKeyError {

}

class PrivateKeyUnknownError extends InvalidPrivateKeyError {

}