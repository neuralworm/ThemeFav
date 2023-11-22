import { Folder } from "../models/Folder"

const obj = {
    fasds: "sdasd",
    osdfonf: "sdad",
    sdasd: true,
    llf: {
        sdsdlls: [
            "sds",
            "sdqwd"
        ],
        sdds: [
            {
                sdsd: 2132
            },
            [
                "sdasd",
                123132,
                false
            ]
        ]
    }
}
console.log(obj)
console.log(JSON.stringify(obj))
console.log(JSON.parse(JSON.stringify(obj)))
console.log(JSON.stringify(JSON.parse(JSON.stringify(obj))))

let folder = new Folder([], "test folder")
console.log(JSON.stringify(folder))
console.log(Folder.folders)
