import * as net from 'net'
import * as http from 'http'

import * as express from 'express'
import { DEFAULT_TRANSMISSION_PORT } from "./utils/utils"
import { ParamsDictionary } from 'express-serve-static-core'
import { getHostIp } from './utils/networking'
import { IEncryptor } from './utils/security'

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

        app.get(this.baseUrl, (req, res) => {
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

    public async requestAsync(destAddress: string, destPort: number, baseUrl: string, content: string): Promise<string> {

    }

    public constructor({
        port = DEFAULT_TRANSMISSION_PORT,
    } = {}) {
        this.address = getHostIp()
        this.port = port
    }
}