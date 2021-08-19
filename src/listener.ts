import * as dgram from "dgram"
import * as ip from "ip"
import Commdata, { HostRule } from "./utils/commdata"
import SocketFactory from "./utils/socket-factory"
import { DEFAULT_PORT } from "./utils/utils"

export default class Listener {

    private address: string

    private port: number

    private socket: dgram.Socket = null

    protected ip: string

    private factory: SocketFactory = new SocketFactory()

    public set guideAddress(value: string) {
        this.ip = value
    }

    protected savedInfo = {}

    public get Cache() {
        return this.savedInfo
    }

    public listen(forceRelisten = false, onDataUpdate: (listener: Listener) => void): void {
        if (this.socket !== null) {
            if (forceRelisten) {
                this.stop()
            } else {
                return
            }
        }

        this.socket = this.factory.getSocket()

        this.socket.on("message", (msg, rinfo) => {
            console.log('Message get!')
            const data = Commdata.fromString(msg.toString())

            if (data === null) {
                return
            }

            switch (data.role) {
                case HostRule.FINDER:
                    this.socket.send(
                        new Commdata(HostRule.LISTENER, this.ip).toString(),
                        rinfo.port,
                        rinfo.address,
                    )
                    console.log(rinfo.address)
                    break

                case HostRule.LISTENER:
                    if (data === null) {
                        break
                    }

                    this.savedInfo['ip'] = data.ip
                    onDataUpdate(this)
                    break

                default:
                    break
            }
        })

        this.socket.on('listening', () => {
            const address = this.socket.address();
            console.log(`server listening ${address.address}:${address.port}`);
        });

        this.socket.bind(this.port, this.address)
        console.log(this.address)
    }

    public stop(flush = true): void {
        this.socket?.close()
        this.socket = null

        if (flush) {
            this.savedInfo = {}
        }
    }

    public constructor({
        address = "0.0.0.0",
        port = DEFAULT_PORT,
        guideAddress = ip.address()
    } = {}) {
        this.address = address
        this.port = port
        this.ip = guideAddress
    }
}