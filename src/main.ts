import Finder from "./finder"
import Listener from "./listener"

function main() {
    const listener = new Listener({
        address: "192.168.43.43",
        guideAddress: "192.168.43.43"
    })

    listener.listen(false, () => { })

    const finder = new Finder("192.168.43.1-192.168.43.255", "255.255.0.0")
    finder.findAsync().then(value => {
        console.log(`Host found: ${value.ip}`)
    })
}

main()