import * as dgram from 'dgram'

export default class SocketFactory {
    public getSocket(): dgram.Socket {
        return dgram.createSocket({
            type: 'udp4',
            reuseAddr: true
        })
    }
}