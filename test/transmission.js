const assert = require('assert')
const { Server, Client } = require("../dist/transmission")

describe("transmission-test", function () {
    this.timeout(0)

    const server = new Server({
        address: '127.0.0.1',
        port: 3000,
        baseUrl: "/connect"
    })

    const client = new Client()

    before(function () {
        server.listen((address, port, params, content) => {
            console.log(address)
            console.log(port)

            if (content === 'F') {
                return {
                    hello: "Hello world!"
                }
            } else {
                return {
                    hello: "Error!"
                }
            }

        })
    })

    it("try-transmit", async () => {
        const result = await client.requestAsync("127.0.0.1", 3000, "/connect", "F")
        assert.equal(JSON.parse(result).hello, "Hello world!")
    })
})