import * as net from "net"

import { IPIterator, IpType, splitIpv4 } from "../utils/utils"
import { IpRangeItem, DiscoveryResult } from "../utils/data-structure"

export default class DiscoveryClient {

    private ipRange: IpRangeItem[]

    private mask: string

    private ipType: IpType

    private baseUrl: string = "/connect"

    private port: number

    private timeout: number

    // Reserved
    // private portRange: string = ""

    public get BaseUrl() {
        return this.baseUrl
    }

    public set BaseUrl(value) {
        this.baseUrl = value
    }

    public static getIpRangeFromString(ipRangeString: string): IpRangeItem[] {
        const ipList = ipRangeString.split(",")

        let ipRange: IpRangeItem[] = []

        for (let item of ipList) {
            const newItem = new IpRangeItem()
            const ipItem = item.split("-")

            if (ipItem.length == 1) {
                newItem.start = newItem.end = ipItem[0]
            } else if (ipItem.length >= 2) {
                newItem.start = ipItem[0]
                newItem.end = ipItem[1]
            }

            ipRange.push(newItem)
        }

        return ipRange
    }

    public constructor(ipRange: IpRangeItem[] | string,
        subnetMask: string,
        {
            port = 3000,
            timeout = 100,
            ipType = IpType.IPv4
        } = {}) {
        if (typeof ipRange === 'string') {
            this.ipRange = DiscoveryClient.getIpRangeFromString(ipRange as string)
        } else {
            this.ipRange = ipRange as IpRangeItem[]
        }

        this.ipType = ipType
        this.mask = subnetMask
        this.port = port
        this.timeout = timeout
    }

    private connect(socket: net.Socket, ip: string, rawHttp: string = null) {
        let result = new DiscoveryResult()

        result.ip = ip
        result.port = this.port.toString()
        result.msg = ""

        return new Promise<DiscoveryResult>((resolve, reject) => {
            socket.connect(this.port, ip, () => {
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
            }).setTimeout(this.timeout)
        })
    }

    private async attemptToConnectAsync(ip: string): Promise<DiscoveryResult> {
        console.log(`IP: ${ip}`)
        const socket = new net.Socket()

        // let rawHttp = `GET ${this.baseUrl} HTTP/1.1\nHost: ${ip}\n`
        // rawHttp += `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36 Edg/92.0.902.55\n`
        // // rawHttp += `Accept: application/json\n`
        // rawHttp += `Connection: keep-alive\n`

        return await this.connect(socket, ip)
    }

    public async searchAsync(CIDR: boolean = true): Promise<DiscoveryResult> {
        console.log("Searching...")
        for (let batch of this.ipRange) {
            const ipIter = new IPIterator(batch.start, this.ipType, this.mask, CIDR)

            let current: string = ipIter.CurrentIp
            while (current !== null && current != batch.end) {
                const result = await this.attemptToConnectAsync(current)
                if (result !== null) {
                    return result
                }

                current = ipIter.nextHost()
            }
        }

        return null
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

