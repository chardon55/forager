import * as express from 'express'
import { DEFAULT_TRANSMISSION_PORT } from "./utils/utils"

export class Server {
    private app = express()

    public listen(onSend: (address: string, port: number, content: string) => string) {
    }

    public close() { }

    public constructor(address: string = "0.0.0.0", port: number = DEFAULT_TRANSMISSION_PORT) {

    }
}

export class Client {

}