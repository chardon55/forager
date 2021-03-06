import { IpRangeItem } from "./data-structure"
import { getMaskByIp } from "./networking"

export const DEFAULT_PORT = 19856
export const DEFAULT_TRANSMISSION_PORT = 19862

export function splitIpv4(ip: string): number[] {
    return ip.split(".").map(value => parseInt(value))
}

export function mergeIpv4(ipNumbers: number[]): string {
    return `${ipNumbers[0]}.${ipNumbers[1]}.${ipNumbers[2]}.${ipNumbers[3]}`
}

export function bitNot(number: number) {
    return ~number & 255
}

export class IPIterator {

    private ipNumbers: number[]

    public get Ip(): string {
        return mergeIpv4(this.ipNumbers)
    }

    private ipType: IpType

    private mask: string = null

    private isCIDR: boolean

    public constructor(ip: string, ipType: IpType = IpType.IPv4,
        subnetMask?: string,
        isCIDR: boolean = false) {
        this.ipNumbers = splitIpv4(ip)
        this.ipType = ipType
        if (!subnetMask) {
            subnetMask = getMaskByIp(ip)
        }

        this.mask = subnetMask
        this.isCIDR = isCIDR
    }

    public get CurrentIp() {
        return this.Ip
    }

    private getHost(): string {
        const ip = this.ipNumbers
        const mask = splitIpv4(this.mask)

        let resultIp = []

        for (let i in ip) {
            resultIp.push(ip[i] & bitNot(mask[i]))
        }

        return mergeIpv4(resultIp)
    }

    private getNet(): string {
        const ip = this.ipNumbers
        const mask = splitIpv4(this.mask)

        let resultIp = []

        for (let i in ip) {
            resultIp.push(ip[i] & mask[i])
        }

        return mergeIpv4(resultIp)
    }

    public get IsHostAddress(): boolean {
        if (this.isCIDR) {
            return true
        }

        const hostAddress = this.getHost()
        return hostAddress != "0.0.0.0" && hostAddress != mergeIpv4(splitIpv4(this.mask).map(value => bitNot(value)))
    }

    public get IsFirstHost(): boolean {
        const host = this.getHost()

        if (this.isCIDR) {
            return host == "0.0.0.0"
        }

        return host == "0.0.0.1"
    }

    public get IsLastHost(): boolean {
        let lastHost = splitIpv4(this.mask).map(value => bitNot(value))
        if (!this.isCIDR) {
            lastHost[3]--
        }

        return this.getHost() == mergeIpv4(lastHost);
    }

    public prevHost(): string {
        if (this.IsFirstHost) {
            return null
        }

        let ip = splitIpv4(this.Ip)

        let carryDigit = true
        for (let i = ip.length - 1; i >= 0 && carryDigit; i--) {
            ip[i]--

            const toHead = ip[i] < 0
            carryDigit = toHead
            if (toHead) {
                ip[i] = 255
            }
        }

        this.ipNumbers = ip
        return this.Ip
    }

    public nextHost(): string {
        if (this.IsLastHost) {
            return null
        }

        let ip = splitIpv4(this.Ip)

        let carryDigit = true
        for (let i = ip.length - 1; i >= 0 && carryDigit; i--) {
            ip[i]++

            const toTail = ip[i] > 255
            carryDigit = toTail
            if (toTail) {
                ip[i] = 0
            }
        }

        this.ipNumbers = ip

        return this.Ip
    }

    public toString(): string {
        return this.Ip
    }
}

export enum IpType {
    IPv4,
    IPv6,
}

export function getIpRangeFromString(ipRangeString: string): IpRangeItem[] {
    const ipList = ipRangeString.split(",")

    let ipRange: IpRangeItem[] = []

    let mask: string = null

    for (let item of ipList) {
        const newItem = new IpRangeItem()
        const ipItem = item.split("-")

        if (ipItem.length == 1) {
            newItem.start = newItem.end = ipItem[0]
        } else if (ipItem.length >= 2) {
            newItem.start = ipItem[0]
            newItem.end = ipItem[1]
        }

        if (mask === null) {
            mask = getMaskByIp(newItem.start)
        }

        newItem.mask = mask
        ipRange.push(newItem)
    }

    return ipRange
}