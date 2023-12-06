import { sections } from "../constants/mashupsections"
import { IThemeEXT } from "./IThemeExtJSON"

export class MashupTheme{
    name: string = "New Custom Theme"
    activitybar?: IThemeEXT
    statusbar?: IThemeEXT
    base?: IThemeEXT
    terminal?: IThemeEXT

    baseProp: string = "workbench.colorTheme"
    customProp: string = "workbench.colorCustomizations"

    static updateActivityBar = (theme: IThemeEXT) => {
        // Get activity bar section of colors from the theme JSON file
    }
}
export interface IMashupTheme{
    [key: string]: MashupSlot
}
export const createMashupTheme = (): IMashupTheme => {
    const mashupTheme: IMashupTheme = {}
    sections.forEach((section: string)=>{
        mashupTheme[section] = {
            theme: undefined,
            locked: false
        }
    })
    // @ts-ignore
    return mashupTheme
    
}
export interface MashupSlot{
    theme: IThemeEXT|undefined,
    locked: boolean
}
enum WorkBenchArea{
    "activitybar",
    "statusbar"
}