const assert = require('assert')
const dc = require('../dist/common-lib/service-discovery/discovery-client')
const express = require('express')

describe('client-main', function () {
    this.timeout(0)

    before('load-express', function () {
        const app = express()
        app.get('/connect', (req, res) => {
            res.send(
                {
                    "room_num": "127.0.5.0"
                }
            )
        })

        app.listen(3000, () => {
            console.log(`Example app listening at http://localhost:3000`)
        })
    })

    describe('#find', function () {
        const client = new dc.default("192.168.0.0-192.168.0.255", "255.255.255.0", {
            timeout: 100
        })

        it ('Search for target server', async () => {
            const value = await client.searchAsync()
            console.log(value)
            assert.strictEqual(value.ip, "192.168.0.109")
        })
    })
})