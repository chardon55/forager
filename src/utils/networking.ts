import * as os from 'os'

import * as ip from 'ip'

import { IpInfo, IpRangeItem } from "./data-structure"
import { splitIpv4, bitNot } from "./utils"

const DEFAULT_SEQUENCE = [
    "WLAN",
    "Ethernet",
    "vEthernet",
    "vEthernet (WLAN)",
]

export function getHostIp(networkSequence: Array<string> = DEFAULT_SEQUENCE): string {
    for (let item of networkSequence) {
        try {
            return ip.address(item)
        } catch {
            continue
        }
    }

    return ip.address()
}

export function getHostAddressInfo(networkSequence: Array<string> = DEFAULT_SEQUENCE,
    family: 'IPv4' | 'IPv6' = 'IPv4'): IpInfo {
    const interfaces = os.networkInterfaces()

    for (let item of networkSequence) {
        const networkList = interfaces[item]
        if (!networkList) {
            continue
        }

        for (let info of networkList) {
            if (info.family !== family) {
                continue
            }

            const ipInfo = new IpInfo()
            ipInfo.address = info.address
            ipInfo.mask = info.netmask

            return ipInfo
        }
    }

    return null
}

export function getMaskByIp(ip: string): string {
    const ipArr = ip.split('.')

    const firstDigit = parseInt(ipArr[0])

    if (firstDigit < 128) {
        return "255.0.0.0"
    }

    if (firstDigit < 192) {
        return "255.255.0.0"
    }

    if (firstDigit < 224) {
        return "255.255.255.0"
    }

    return "255.0.0.0"
}

export function getNetworkRange(address?: string, mask?: string): IpRangeItem {
    if (!address) {
        const info = getHostAddressInfo()
        address = info.address
        mask = info.mask
    }

    if (!mask) {
        mask = getMaskByIp(address)
    }

    const item = new IpRangeItem()

    const addressArr = splitIpv4(address)
    const maskArr = splitIpv4(mask)

    let start = ""
    let end = ""
    for (let index in maskArr) {
        const startPart = addressArr[index] & maskArr[index]
        const endPart = startPart | bitNot(maskArr[index])

        start += `${startPart}.`
        end += `${endPart}.`
    }

    const range = new IpRangeItem()
    range.start = start.substring(0, start.length)
    range.end = end.substring(0, end.length)

    return range
}