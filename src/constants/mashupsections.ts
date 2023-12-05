import * as jsonTemplate from '../template/sections.json'

export const sections: string[] = ["base", "tokens", ...Object.keys(jsonTemplate)]

export const sectionMap: Map<string,string> = new Map([
    ["terminal", "terminal"]
])