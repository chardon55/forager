import DiscoveryClient from "./common-lib/service-discovery/discovery-client"

function main() {
    const client = new DiscoveryClient("192.168.0.0-192.168.0.255", "255.255.255.0", {
        timeout: 100
    })

    client.searchAsync().then(value => {
        console.log(value)
    })
}

main()