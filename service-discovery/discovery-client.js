"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryResult = exports.IpRangeItem = void 0;
const net = require("net");
const utils_1 = require("./utils");
class IpRangeItem {
}
exports.IpRangeItem = IpRangeItem;
class DiscoveryResult {
}
exports.DiscoveryResult = DiscoveryResult;
class DiscoveryClient {
    constructor(ipRange, subnetMask, { port = 3000, timeout = 100, ipType = utils_1.IpType.IPv4 } = {}) {
        this.baseUrl = "/connect";
        if (typeof ipRange === 'string') {
            this.ipRange = DiscoveryClient.getIpRangeFromString(ipRange);
        }
        else {
            this.ipRange = ipRange;
        }
        this.ipType = ipType;
        this.mask = subnetMask;
        this.port = port;
        this.timeout = timeout;
    }
    // Reserved
    // private portRange: string = ""
    get BaseUrl() {
        return this.baseUrl;
    }
    set BaseUrl(value) {
        this.baseUrl = value;
    }
    static getIpRangeFromString(ipRangeString) {
        const ipList = ipRangeString.split(",");
        let ipRange = [];
        for (let item of ipList) {
            const newItem = new IpRangeItem();
            const ipItem = item.split("-");
            if (ipItem.length == 1) {
                newItem.start = newItem.end = ipItem[0];
            }
            else if (ipItem.length >= 2) {
                newItem.start = ipItem[0];
                newItem.end = ipItem[1];
            }
            ipRange.push(newItem);
        }
        return ipRange;
    }
    connect(socket, ip, rawHttp = null) {
        let result = new DiscoveryResult();
        result.ip = ip;
        result.port = this.port.toString();
        result.msg = "";
        return new Promise((resolve, reject) => {
            socket.connect(this.port, ip, () => {
                console.log("Connected!" + ip);
                resolve(result);
            }).on('error', err => {
                console.log(err);
                resolve(null);
                socket.destroy();
            }).on('timeout', () => {
                console.log("Timeout " + ip);
                resolve(null);
                socket.destroy();
            }).on('close', () => {
                console.log("Closing... " + ip);
                // resolve(null)
            }).setTimeout(this.timeout);
        });
    }
    attemptToConnectAsync(ip) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`IP: ${ip}`);
            const socket = new net.Socket();
            // let rawHttp = `GET ${this.baseUrl} HTTP/1.1\nHost: ${ip}\n`
            // rawHttp += `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36 Edg/92.0.902.55\n`
            // // rawHttp += `Accept: application/json\n`
            // rawHttp += `Connection: keep-alive\n`
            return yield this.connect(socket, ip);
        });
    }
    searchAsync(CIDR = true) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Searching...");
            for (let batch of this.ipRange) {
                const ipIter = new utils_1.IPIterator(batch.start, this.ipType, this.mask, CIDR);
                let current = ipIter.CurrentIp;
                while (current !== null && current != batch.end) {
                    const result = yield this.attemptToConnectAsync(current);
                    if (result !== null) {
                        return result;
                    }
                    current = ipIter.nextHost();
                }
            }
            return null;
        });
    }
    /**
     * If the inputted address is a valid IPv4 address
     *
     * @constructor
     */
    static isValidIp(ip) {
        const ipNumbers = utils_1.splitIpv4(ip);
        for (let item of ipNumbers) {
            let p;
            try {
                p = item;
            }
            catch (e) {
                // console.log(e)
                return false;
            }
            if (p < 0 || p > 255) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get inputted port
     *
     * @constructor
     */
    get Port() {
        return this.port;
    }
    /**
     * Update port
     *
     * @param value New port
     * @constructor
     */
    set Port(value) {
        this.port = value;
    }
}
exports.default = DiscoveryClient;
//# sourceMappingURL=discovery-client.js.map