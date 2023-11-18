import * as vscode from 'vscode'
export const getFavorites = (context: vscode.ExtensionContext): string[] => {
    let state = context.globalState
    let favoriteString: string|undefined = state.get('theme_favorites')
    
    try{
        JSON.parse(favoriteString!)
    }
    catch(e){
        favoriteString = "[]"
    }

    console.log("Retrieved " + favoriteString)
    if(!favoriteString) favoriteString = "[]"

    let favoriteArray: string[] = JSON.parse(favoriteString)
    console.log("Favorites: " + favoriteString)
    return favoriteArray
}
export const saveTheme = (context: vscode.ExtensionContext) => {
    let themeString = getCurrentTheme()
    let favoriteArray = getFavorites(context)
    if(favoriteArray.indexOf(themeString) == -1){
        favoriteArray.push(themeString)
    }
    let toSave = JSON.stringify(favoriteArray)
    console.log(toSave)
    context.globalState.update("theme_favorites", toSave)
}
// export const getExtensionThemes = () => {
//     vscode.extensions.all.forEach((ext: vscode.Extension<any>, index: number) => {
//         console.log(ext.id)
//         let cont = ext.packageJSON.contributes ? ext.packageJSON.contributes : null
//         console.log(cont)
//         if(cont){
//             cont.forEach((contObj: any) => {
//                 let label = contObj.label
//                 console.log(label)
//             })
//         }
//     })
// }
export const activateTheme = (themeString: string) => {
    vscode.commands.executeCommand("workbench.action.selectTheme").then((val: any)=>{
        vscode.commands.executeCommand(themeString).then(()=>{

        })
    })
}

export const selectFavorite = (context: vscode.ExtensionContext) => {
    let favs = getFavorites(context)
    let quickPicks: vscode.QuickPickItem[] = []
    favs.forEach((val: string) => {
        let quickPick: vscode.QuickPickItem = {
            label: val,
        }
        quickPicks.push(quickPick)
        
    })
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = quickPicks
    quickPickAction.title = "Select theme."

    // Callbacks
    quickPickAction.onDidAccept(() => {
        const selection = quickPickAction.activeItems[0]
        setTheme(selection.label)
        quickPickAction.hide()
    })



    quickPickAction.show()
}

export const setTheme = (themeString: string) => {
    let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
    config.update("workbench.colorTheme", themeString)
}

export const getCurrentTheme = (): string => {
    let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
    let theme: string = config.get("workbench.colorTheme")!
    console.log("Current theme is " + theme)
    return theme
}