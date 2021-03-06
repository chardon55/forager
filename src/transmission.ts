import * as http from 'http'

import * as express from 'express'
import axios, { AxiosResponse } from 'axios'
import { DEFAULT_TRANSMISSION_PORT } from "./utils/utils"
import { ParamsDictionary } from 'express-serve-static-core'
import { getHostIp } from './utils/networking'
import { IEncryptor } from './utils/security'
import { RequestFailedError } from './exceptions'

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

    public listen(onResponse: (address: string, port: number, params: ParamsDictionary, content: any) => object) {
        this.close()

        const app = express()

        app.use(express.urlencoded({ extended: true }))
        app.use(express.json())

        app.post(this.baseUrl, (req, res) => {

            console.log(req.body)
            let resBody = onResponse(req.socket.remoteAddress, req.socket.remotePort, req.params, req.body)
            if (!resBody) {
                res.status(200).json(resBody)
            }
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

    public async requestAsync(destAddress: string, destPort: number, {
        baseUrl = "/",
        params = {},
        body = null,
        headers = {}
    }): Promise<any> {

        const urlPrefix = baseUrl.startsWith("/") ? "" : "/"

        let response: AxiosResponse<any>
        try {
            response = await axios({
                method: "POST",
                url: `http://${destAddress}:${destPort}${urlPrefix}${baseUrl}`,
                data: body,
                params: params,
                headers: headers,
                timeout: 5000,
            })
        } catch (error) {
            throw new RequestFailedError(error.response.status, error.response.data)
        }

        if (/^[34]\d\d$/.test(response.status.toString())) {
            throw new RequestFailedError(response.status, response?.data)
        }

        return await new Promise<any>((resolve, reject) => {
            if (!this.encryptor) {
                resolve(response.data)
            } else {
                const result = this.encryptor.decrypt(response.data)
                resolve(result)
            }
        })
    }

    public constructor({
        port = DEFAULT_TRANSMISSION_PORT,
    } = {}) {
        this.address = getHostIp()
        this.port = port
    }
}