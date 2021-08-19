import * as dgram from "dgram"
import Listener from "./listener"
import Commdata, { HostRule } from "./utils/commdata"
import * as ip from 'ip'
import { AbortController } from 'node-abort-controller'

import { DiscoveryResult, IpRangeItem } from "./utils/data-structure"
import { DEFAULT_PORT, getIpRangeFromString, IPIterator, IpType } from "./utils/utils"
import SocketFactory from "./utils/socket-factory"

export default class Finder {

    private ipRange: IpRangeItem[]

    private mask: string

    private ipType: IpType

    private port: number

    private address = ip.address()

    private timeout: number

    private listener: Listener

    private abortController: AbortController = null

    private socket: dgram.Socket = null

    private factory: SocketFactory = new SocketFactory()

    public reset(abort = true) {
        if (abort) {
            this.abortController?.abort()
            this.abortController = null
        }

        this.socket?.close()
        this.socket = null

        this.listener?.stop()
    }

    public findAsync(): Promise<DiscoveryResult> {
        return new Promise<DiscoveryResult>((resolve, reject) => {
            this.reset()

            this.abortController = new AbortController()
            this.abortController.signal.addEventListener('abort', ev => {
                this.reset(false)
                reject("Stopped by other task(s)")
            })

            this.socket = this.factory.getSocket()

            this.listener.listen(false, l => {
                const result = new DiscoveryResult()
                result.ip = l.Cache['ip']
                result.port = this.port.toString()
                result.msg = ""

                this.socket?.close()
                this.socket = null
                this.abortController = null

                resolve(result)
            })

            while (true) {
                for (let batch of this.ipRange) {
                    const ipIter = new IPIterator(batch.start, this.ipType, this.mask, true)

                    let current: string = ipIter.CurrentIp
                    while (current !== null && current != batch.end) {
                        this.socket.send(
                            new Commdata(HostRule.FINDER, this.address).toString(),
                            this.port,
                            current,
                        )
                        console.log(current)

                        current = ipIter.nextHost()
                    }
                }
            }
        })
    }

    public constructor(ipRange: IpRangeItem[] | string,
        subnetMask: string,
        {
            port = DEFAULT_PORT,
            timeout = 100,
            ipType = IpType.IPv4
        } = {}) {
        if (typeof ipRange === 'string') {
            this.ipRange = getIpRangeFromString(ipRange as string)
        } else {
            this.ipRange = ipRange as IpRangeItem[]
        }

        this.ipType = ipType
        this.mask = subnetMask
        this.port = port
        this.timeout = timeout

        this.listener = new Listener({
            address: ip.address(),
            port: port,
        })
    }
}