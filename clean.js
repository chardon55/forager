const fs = require('fs')

const dirs = [
    "./dist",
    "./out"
]

function main() {
    console.log("Cleaning start")

    for (let dir of dirs) {
        fs.rmSync(dir, {
            force: true,
            recursive: true,
        })
        console.log(`Deleted ${dir}`)
    }

    console.log('Cleaning completed')
}

main()