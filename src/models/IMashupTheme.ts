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
    [key: string]: any
}
export const createMashupTheme = (): IMashupTheme => {
    return {
    }
    
}
interface MashupSlot{
    theme: IThemeEXT,
    locked: boolean
}
enum WorkBenchArea{
    "activitybar",
    "statusbar"
}