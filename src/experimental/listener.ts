import * as dgram from "dgram"
import * as ip from "ip"
import Commdata, { HostRule } from "../utils/commdata"
import { getHostIp, getMaskByIp } from "../utils/networking"
import SocketFactory from "../utils/socket-factory"
import { DEFAULT_PORT } from "../utils/utils"

export class ListenerStretagy {

    public resetSocket(listener: Listener, socket: dgram.Socket, forceRelisten: boolean = false): boolean {
        if (socket !== null) {
            if (forceRelisten) {
                listener.stop()
            } else {
                return true
            }
        }

        return false
    }

    public async useSocketAsync(socket: dgram.Socket,
        port: number, address: string, guideIp: string | object,
        onDataUpdate: (data: Commdata) => void): Promise<void> {

        socket.on("message", (msg, rinfo) => {
            console.log('Message get!')
            const data = Commdata.fromString(msg.toString())

            if (data === null) {
                return
            }

            switch (data.role) {
                case HostRule.FINDER:
                    if (guideIp === null) {
                        break
                    }

                    let ip: string
                    if (typeof guideIp === 'string') {
                        ip = guideIp as string
                    } else {
                        ip = guideIp['ip'] as string
                    }

                    if (ip === null) {
                        break
                    }

                    socket.send(
                        new Commdata(HostRule.LISTENER, ip).toString(),
                        rinfo.port,
                        rinfo.address,
                    )
                    console.log(rinfo.address)
                    break

                case HostRule.LISTENER:
                    if (data === null) {
                        break
                    }

                    onDataUpdate(data)
                    break

                default:
                    break
            }
        })

        socket.on('listening', () => {
            const address = socket.address();
            console.log(`server listening ${address.address}:${address.port}`);
        });

        await new Promise<void>((resolve, reject) => {
            socket.bind(port, address, () => {
                resolve()
            })
        })
    }
}

export default class Listener {

    private address: string

    private mask: string

    private port: number

    protected socket: dgram.Socket = null

    protected ip: string

    private listenerStragegy: ListenerStretagy = new ListenerStretagy()

    private factory: SocketFactory = new SocketFactory()

    public set guideAddress(value: string) {
        this.ip = value
    }

    protected savedInfo = {}

    public get Cache() {
        return this.savedInfo
    }

    public listen(forceRelisten = false, onDataUpdate: (listener: Listener, data: Commdata) => void = () => { }): void {
        if (this.listenerStragegy.resetSocket(this, this.socket, forceRelisten)) {
            return
        }

        this.socket = this.factory.getSocket()

        this.listenerStragegy.useSocketAsync(this.socket, this.port, this.address, this.ip, data => {
            this.savedInfo['ip'] = data.ip
            onDataUpdate(this, data)
        })
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
        mask = null,
        port = DEFAULT_PORT,
        guideAddress = null
    } = {}) {
        this.address = address

        if (!mask) {
            mask = getMaskByIp(address)
        }

        this.mask = mask
        this.port = port

        if (!guideAddress) {
            guideAddress = getHostIp()
        }

        this.ip = guideAddress
    }
}