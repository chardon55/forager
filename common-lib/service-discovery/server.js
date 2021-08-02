"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
class Server {
    constructor() {
    }
    listen() {
        this.server = net.createServer(_this => {
            _this.on('data', data => {
                console.log("Request received");
                // console.log(data.toString())
                _this.write('{"test": "OK"}');
            });
        });
        this.server.listen(3000, () => {
            console.log("Server started at port 3000");
        });
    }
}
exports.default = Server;
//# sourceMappingURL=server.js.map