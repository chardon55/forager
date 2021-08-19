const HEADER = "##CHCP%"

export default class Commdata {

    public role: HostRule

    public ip: string

    public static fromString(data: string): Commdata {
        if (!data) {
            return
        }

        const splitedGram = data.split("%")
        if (splitedGram.length < 2 || splitedGram[0] + "%" !== HEADER) {
            return null
        }

        const splited = splitedGram[1].split("|")
        return new Commdata(toHostRule(splited[0]), splited[1])
    }

    public constructor(role: HostRule, ip: string) {
        this.role = role
        this.ip = ip
    }

    public toString(): string {
        return `${HEADER}${this.role}|${this.ip}`
    }
}

export enum HostRule {
    LISTENER = "L", FINDER = "F", UNKNOWN = "U"
}

function toHostRule(str: string): HostRule {
    for (let i of Object.values(HostRule)) {
        if (i == str) {
            return i
        }
    }

    return HostRule.UNKNOWN
}