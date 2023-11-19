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
export const saveThemeToState = (context: vscode.ExtensionContext) => {
    let themeString = getCurrentTheme()
    let favoriteArray = getFavorites(context)
    if(favoriteArray.indexOf(themeString) == -1){
        favoriteArray.push(themeString)
    }
    else return
    let toSave = JSON.stringify(favoriteArray)
    context.globalState.update("theme_favorites", toSave)
    vscode.window.showInformationMessage(themeString + " saved to favorites.")
}
export const removeThemeFromState = (context: vscode.ExtensionContext, themeString: string) => {
    console.log('request to remove ' + themeString)
    let favorites: string[] = getFavorites(context)
    let ind = favorites.indexOf(themeString)
    console.log(ind)
    if(ind == -1) return
    favorites.splice(ind, 1)
    console.log(favorites)
    context.globalState.update("theme_favorites", JSON.stringify(favorites))
}
export const activateTheme = (themeString: string) => {
    vscode.commands.executeCommand("workbench.action.selectTheme").then((val: any)=>{
        vscode.commands.executeCommand(themeString).then(()=>{

        })
    })
}


// MENU ACTION
export const selectFavorite = (context: vscode.ExtensionContext) => {
    let favs = getFavorites(context)
    let current = getCurrentTheme()
    let currentIncludedInFavorites = doesContain(favs, current)


    // CREATE OPTIONS
    let quickPickItems: vscode.QuickPickItem[] = []
    favs.forEach((val: string) => {
        let quickPick: vscode.QuickPickItem = {
            label: val,
        }
        quickPickItems.push(quickPick)
        
    })

    // SETUP
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = quickPickItems
    quickPickAction.title = "Select theme."

    // SET ACTIVE IF POSSIBLE
    if(currentIncludedInFavorites){
        let indexOfCurrent = quickPickItems.map((qp) => {
            return qp.label
        }).indexOf(current)
        quickPickAction.activeItems = [quickPickItems[indexOfCurrent]]
    }



    // CALLBACKS
    quickPickAction.onDidAccept(() => {
        const selection = quickPickAction.activeItems[0]
        setTheme(selection.label)
        quickPickAction.hide()
        
    })
    quickPickAction.onDidChangeActive(() => {
        const selection = quickPickAction.activeItems[0]
        setTheme(selection.label)
    })
    
    // ACTIVATE
    quickPickAction.show()
}
export const removeFromFavorites = (context: vscode.ExtensionContext) => {
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
    quickPickAction.title = "Remove theme."

    // Select to remove
    quickPickAction.onDidAccept(() => {
        const selection = quickPickAction.activeItems[0]
        console.log("want to remove " + selection.label)
        removeThemeFromState(context, selection.label)
        quickPickAction.hide()
        vscode.window.showInformationMessage(selection.label + " removed from favorites.")
    })
    quickPickAction.onDidChangeActive(() => {
        const selection = quickPickAction.activeItems[0]
    })
    quickPickAction.show()
}



// UTIL
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

export const doesContain =(favs: string[], themeString: string): boolean => {
    if(favs.indexOf(themeString) === -1) return false
    return true
}