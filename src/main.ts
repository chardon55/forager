import Finder from "./finder"
import Listener from "./listener"

function main() {
    const listener = new Listener()

    listener.listen(false)

    const finder = new Finder()
    finder.findAsync().then(value => {
        console.log(`Host found: ${value.ip}`)
    })
}

main()