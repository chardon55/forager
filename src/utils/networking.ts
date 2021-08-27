import * as ip from 'ip'

import { IpRangeItem } from "./data-structure"
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

export function getNetworkRange(address: string = getHostIp(), mask?: string): IpRangeItem {
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

    start.replace(/\.$/, "")
    end.replace(/\.$/, "")

    const range = new IpRangeItem()
    range.start = start
    range.end = end

    return range
}