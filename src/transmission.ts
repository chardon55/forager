import * as http from 'http'

import * as express from 'express'
import { DEFAULT_TRANSMISSION_PORT } from "./utils/utils"
import { ParamsDictionary } from 'express-serve-static-core'
import { getHostIp } from './utils/networking'
import { IEncryptor } from './utils/security'

import * as semaphore from 'semaphore'

export class Server {
    private address: string
    private port: number
    private baseUrl: string

    private server: http.Server = null

    private encryptor: IEncryptor = null

    public get Encryptor() {
        return this.encryptor
    }

    public set Encryptor(encryptor: IEncryptor) {
        this.encryptor = encryptor
    }

    public listen(onResponse: (address: string, port: number, params: ParamsDictionary, content: string) => object) {
        this.close()

        const app = express()

        app.post(this.baseUrl, (req, res) => {
            const hostParts = req.headers.host.split(":")
            let port = hostParts.length == 1 ? 80 : parseInt(hostParts[1])

            let resBody = onResponse(hostParts[0], port, req.params, req.body)
            res.status(200).json(resBody)
        })

        this.server = app.listen(this.port, this.address, () => {
            console.log(`Forager server started: ${this.address}:${this.port}`)
        })
    }

    public close() {
        if (!this.server) {
            return
        }

        this.server.close()
        this.server = null
    }

    public constructor({
        address = "0.0.0.0",
        port = DEFAULT_TRANSMISSION_PORT,
        baseUrl = "/",
    } = {}) {
        this.address = address
        this.port = port
        this.baseUrl = baseUrl
    }
}

export class Client {

    private address: string
    private port: number

    private encryptor: IEncryptor = null

    public get Encryptor() {
        return this.encryptor
    }

    public set Encryptor(encryptor: IEncryptor) {
        this.encryptor = encryptor
    }

    public async requestAsync(destAddress: string, destPort: number, baseUrl: string, body?: string, headers: {} = {}): Promise<string> {
        const urlPrefix = baseUrl.startsWith("/") ? "" : "/"

        const sem = semaphore(2)
        sem.take(2, () => { })

        let responseString: string = ""

        const req = http.request({
            hostname: destAddress,
            port: destPort,
            path: urlPrefix + baseUrl,
            method: "POST",
            headers: headers,
        }, res => {
            res.on('data', chunk => {
                responseString += chunk
            })

            res.on('end', () => {
                sem.leave()
            })
        })

        req.on('error', e => {
            console.error(`Error: ${e}`)
        })

        if (!!body) {
            req.write(body)
        }

        req.end(() => {
            sem.leave()
        })

        return await new Promise<string>((resolve, reject) => {
            sem.take(2, () => {
                if (!this.encryptor) {
                    resolve(responseString)
                } else {
                    const result = this.encryptor.decrypt(responseString)
                    if (typeof result == 'string') {
                        resolve(result)
                    } else {
                        resolve(JSON.stringify(result))
                    }
                }
            })
        })
    }

    public constructor({
        port = DEFAULT_TRANSMISSION_PORT,
    } = {}) {
        this.address = getHostIp()
        this.port = port
    }
}