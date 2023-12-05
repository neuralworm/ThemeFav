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
    [key: string]: any,
    base?: IThemeEXT
    activitybar?: IThemeEXT
    statusbar?: IThemeEXT
    editor?: IThemeEXT
    terminal?: IThemeEXT
}
export const createMashupTheme = (): IMashupTheme => {
    return {
        base: undefined,
        activitybar: undefined,
        editor: undefined,
        statusbar: undefined,
        terminal: undefined 
    }
    
}
enum WorkBenchArea{
    "activitybar",
    "statusbar"
}