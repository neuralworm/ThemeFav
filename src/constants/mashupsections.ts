import * as jsonTemplate from '../template/sections.json'

export const sections: string[] = ["base", "tokens/syntax", ...Object.keys(jsonTemplate)]
