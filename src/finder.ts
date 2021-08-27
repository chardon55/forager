import * as dgram from "dgram"
import Commdata, { HostRule } from "./utils/commdata"
import * as ip from 'ip'
import { AbortController } from 'node-abort-controller'

import { DiscoveryResult, IpRangeItem } from "./utils/data-structure"
import { DEFAULT_PORT, getIpRangeFromString, IPIterator, IpType } from "./utils/utils"
import SocketFactory from "./utils/socket-factory"
import { ListenerStretagy } from "./listener"
import { getNetworkRange } from "./utils/networking"

export default class Finder {

    private ipRange: IpRangeItem[]

    private mask: string

    private ipType: IpType

    private port: number

    private address = ip.address()

    private timeout: number

    private abortController: AbortController = null

    private socket: dgram.Socket = null

    private factory: SocketFactory = new SocketFactory()

    private listenerStretagy: ListenerStretagy = new ListenerStretagy()

    private cache = {
        'ip': null,
    }

    public reset(abort = true) {
        if (abort) {
            this.abortController?.abort()
            this.abortController = null
        }

        this.socket?.close()
        this.socket = null
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

            this.listenerStretagy.useSocketAsync(this.socket, this.port, this.address, this.cache, data => {
                const result = new DiscoveryResult()
                result.ip = data.ip
                result.port = this.port.toString()
                result.msg = ""

                this.cache['ip'] = result.ip

                this.socket?.close()
                this.socket = null
                this.abortController = null

                resolve(result)
            }).then(() => {
                while (this.socket !== null) {
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
    }

    public get FinderNetwork(): IpRangeItem {
        return getNetworkRange()
    }
}