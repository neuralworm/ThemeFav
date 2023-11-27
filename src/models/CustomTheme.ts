import { ThemeEXT } from "./ThemeExtJSON"

export class CustomTheme{
    name: string = "New Custom Theme"
    activityBar?: ThemeEXT
    statusBar?: ThemeEXT
    base?: ThemeEXT
    terminal?: ThemeEXT

    updateActivityBar = (theme: ThemeEXT) => {
        // Get activity bar section of colors from the theme JSON file
        
    }
}
enum WorkBenchArea{
    "activityBar",
    "statusBar"
}