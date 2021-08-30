const assert = require('assert')
const { Server, Client } = require("../dist/transmission")

describe("transmission-test", function () {
    this.timeout(0)

    const server = new Server({
        address: '127.0.0.3',
        port: 3000,
        baseUrl: "/connect"
    })

    const client = new Client()

    before(function () {
        server.listen((address, port, params, content) => {
            console.log(address)
            console.log(port)

            if (content.F === 'F') {
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
        const result = await client.requestAsync("127.0.0.3", 3000, {
            baseUrl: "/connect",
            body: {
                F: "F"
            }
        })
        assert.equal(result.hello, "Hello world!")
    })

    this.afterAll(() => {
        server.close()
    })
})