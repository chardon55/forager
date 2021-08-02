"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpType = exports.IPIterator = exports.mergeIpv4 = exports.splitIpv4 = void 0;
function splitIpv4(ip) {
    return ip.split(".").map(value => parseInt(value));
}
exports.splitIpv4 = splitIpv4;
function mergeIpv4(ipNumbers) {
    return `${ipNumbers[0]}.${ipNumbers[1]}.${ipNumbers[2]}.${ipNumbers[3]}`;
}
exports.mergeIpv4 = mergeIpv4;
function bitNot(number) {
    return ~number & 255;
}
class IPIterator {
    constructor(ip, ipType = IpType.IPv4, subnetMask, isCIDR = false) {
        this.mask = null;
        this.ipNumbers = splitIpv4(ip);
        this.ipType = ipType;
        if (subnetMask !== null) {
            this.mask = subnetMask;
        }
        this.isCIDR = isCIDR;
    }
    get Ip() {
        return mergeIpv4(this.ipNumbers);
    }
    get CurrentIp() {
        return this.Ip;
    }
    getHost() {
        const ip = this.ipNumbers;
        const mask = splitIpv4(this.mask);
        let resultIp = [];
        for (let i in ip) {
            resultIp.push(ip[i] & bitNot(mask[i]));
        }
        return mergeIpv4(resultIp);
    }
    getNet() {
        const ip = this.ipNumbers;
        const mask = splitIpv4(this.mask);
        let resultIp = [];
        for (let i in ip) {
            resultIp.push(ip[i] & mask[i]);
        }
        return mergeIpv4(resultIp);
    }
    get IsHostAddress() {
        if (this.isCIDR) {
            return true;
        }
        const hostAddress = this.getHost();
        return hostAddress != "0.0.0.0" && hostAddress != mergeIpv4(splitIpv4(this.mask).map(value => bitNot(value)));
    }
    get IsFirstHost() {
        const host = this.getHost();
        if (this.isCIDR) {
            return host == "0.0.0.0";
        }
        return host == "0.0.0.1";
    }
    get IsLastHost() {
        let lastHost = splitIpv4(this.mask).map(value => bitNot(value));
        if (!this.isCIDR) {
            lastHost[3]--;
        }
        return this.getHost() == mergeIpv4(lastHost);
    }
    prevHost() {
        if (this.IsFirstHost) {
            return null;
        }
        let ip = splitIpv4(this.Ip);
        let carryDigit = true;
        for (let i = ip.length - 1; i >= 0 && carryDigit; i--) {
            ip[i]--;
            const toHead = ip[i] < 0;
            carryDigit = toHead;
            if (toHead) {
                ip[i] = 255;
            }
        }
        this.ipNumbers = ip;
        return this.Ip;
    }
    nextHost() {
        if (this.IsLastHost) {
            return null;
        }
        let ip = splitIpv4(this.Ip);
        let carryDigit = true;
        for (let i = ip.length - 1; i >= 0 && carryDigit; i--) {
            ip[i]++;
            const toTail = ip[i] > 255;
            carryDigit = toTail;
            if (toTail) {
                ip[i] = 0;
            }
        }
        this.ipNumbers = ip;
        return this.Ip;
    }
    toString() {
        return this.Ip;
    }
}
exports.IPIterator = IPIterator;
var IpType;
(function (IpType) {
    IpType[IpType["IPv4"] = 0] = "IPv4";
    IpType[IpType["IPv6"] = 1] = "IPv6";
})(IpType = exports.IpType || (exports.IpType = {}));
//# sourceMappingURL=utils.js.map