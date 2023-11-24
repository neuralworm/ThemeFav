import { ThemeExtJSON } from "./ThemeExtJSON"

export class CustomTheme{
    name: string = "New Custom Theme"
    activityBar?: any
    statusBar?: any

    updateActivityBar = (theme: ThemeExtJSON) => {
        // Get activity bar section of colors from the theme JSON file
        
    }
}
enum WorkBenchArea{
    "activityBar",
    "statusBar"
}