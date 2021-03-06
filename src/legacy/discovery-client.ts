import * as net from "net"

import { getIpRangeFromString, IPIterator, IpType, splitIpv4 } from "../utils/utils"
import { IpRangeItem, DiscoveryResult } from "../utils/data-structure"

export default class DiscoveryClient {

    private ipRange: IpRangeItem[]

    private mask: string

    private ipType: IpType

    private baseUrl: string = "/connect"

    private port: number

    private timeout: number

    private locked = false

    // Reserved
    // private portRange: string = ""

    public get BaseUrl() {
        return this.baseUrl
    }

    public set BaseUrl(value) {
        this.baseUrl = value
    }

    public constructor(ipRange: IpRangeItem[] | string,
        subnetMask: string,
        {
            port = 3000,
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

    private connect(socket: net.Socket, ip: string, options = {
        ipRange: this.ipRange,
        subnetMask: this.mask,
        port: this.port,
        timeout: this.timeout,
        ipType: this.ipType,
    }, rawHttp: string = null) {
        let result = new DiscoveryResult()

        result.ip = ip
        result.port = options.port.toString()
        result.msg = ""

        return new Promise<DiscoveryResult>((resolve, reject) => {
            socket.connect(options.port, ip, () => {
                console.log("Connected!" + ip)
                resolve(result)
            }).on('error', err => {
                console.log(err)
                resolve(null)
                socket.destroy()
            }).on('timeout', () => {
                console.log("Timeout " + ip)
                resolve(null)
                socket.destroy()
            }).on('close', () => {
                console.log("Closing... " + ip)
                // resolve(null)
            }).setTimeout(options.timeout)
        })
    }

    private async attemptToConnectAsync(ip: string, options = {
        ipRange: this.ipRange,
        subnetMask: this.mask,
        port: this.port,
        timeout: this.timeout,
        ipType: this.ipType,
    }): Promise<DiscoveryResult> {
        if (this.locked) {
            return null
        }

        console.log(`IP: ${ip}`)
        const socket = new net.Socket()

        // let rawHttp = `GET ${this.baseUrl} HTTP/1.1\nHost: ${ip}\n`
        // rawHttp += `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36 Edg/92.0.902.55\n`
        // // rawHttp += `Accept: application/json\n`
        // rawHttp += `Connection: keep-alive\n`

        return await this.connect(socket, ip, options)
    }

    public async searchAsync(CIDR: boolean = true,
        {
            ipRange = this.ipRange,
            subnetMask = this.mask,
            port = this.port,
            timeout = this.timeout,
            ipType = this.ipType,
        } = {}): Promise<DiscoveryResult> {
        if (this.locked) {
            return null
        }

        console.log("Searching...")
        for (let batch of ipRange) {
            const ipIter = new IPIterator(batch.start, ipType, subnetMask, CIDR)

            let current: string = ipIter.CurrentIp
            while (current !== null && current != batch.end || current == batch.start && current == batch.end) {
                if (this.locked) {
                    break
                }

                const result = await this.attemptToConnectAsync(current, {
                    ipRange: ipRange,
                    subnetMask: subnetMask,
                    port: port,
                    timeout: timeout,
                    ipType: ipType,
                })
                if (result !== null) {
                    return result
                }

                current = ipIter.nextHost()
            }
        }

        return null
    }

    public lock() {
        this.locked = true
    }

    public unlock() {
        this.locked = false
    }

    public get Locked() {
        return this.locked
    }

    /**
     * If the inputted address is a valid IPv4 address
     *
     * @constructor
     */
    public static isValidIp(ip: string): boolean {
        const ipNumbers = splitIpv4(ip)

        for (let item of ipNumbers) {
            let p: number
            try {
                p = item
            } catch (e) {
                // console.log(e)
                return false
            }

            if (p < 0 || p > 255) {
                return false
            }
        }

        return true
    }

    /**
     * Get inputted port
     *
     * @constructor
     */
    public get Port() {
        return this.port
    }

    /**
     * Update port
     *
     * @param value New port
     * @constructor
     */
    public set Port(value) {
        this.port = value
    }
}

