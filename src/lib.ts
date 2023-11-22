import * as vscode from 'vscode'
import { ThemeFav, ThemeFavProvider } from './TreeViewProvider'
import { ThemeExtJSON, ThemeExtJSON2, createThemeExtJSON } from './ThemeExtJSON'

// BASIC STATE MANAGEMENT
export const resetState = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("themeFav_favorites", "[]").then(()=>{
        themeProvider.refresh()
    })
}
export const updateThemeState = (newFavs: ThemeExtJSON[], context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("themeFav_favorites", JSON.stringify(newFavs)).then(()=>{
        themeProvider.refresh()
        console.log("new favs: "+ getFavorites(context))
    })
}
export const updateHistoryState = (newHistory: ThemeExtJSON[], context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("themeFav_history", JSON.stringify(newHistory)).then(()=>{
        themeProvider.refresh()
    })
}
export const getFavorites = (context: vscode.ExtensionContext): ThemeExtJSON[] => {
    let state = context.globalState
    let favoriteString: string | undefined = state.get('themeFav_favorites')
    // ATTEMPT TO PARSE
    try {
        JSON.parse(favoriteString!)
    }
    catch (e) {
        favoriteString = "[]"
    }
    if (!favoriteString) favoriteString = "[]"
    let favoriteArray: ThemeExtJSON[] = JSON.parse(favoriteString)
    return favoriteArray
}
export const getHistory = (context: vscode.ExtensionContext) => {
    let history: string | undefined = context.globalState.get("themeFav_history")
    try {
        JSON.parse(history!)
    }
    catch (e) {
        history = "[]"
    }
    if (!history) history = "[]"
    let historyArray: string[] = JSON.parse(history)
    return historyArray
}
export const saveThemeToState = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let themeString: ThemeExtJSON = getCurrentTheme()
    let favoriteArray: ThemeExtJSON[] = getFavorites(context)
    if (favoriteArray.indexOf(themeString) == -1) {
        favoriteArray.push(themeString)
    }
    else return
    updateThemeState(favoriteArray, context, themeProvider)
   
}
export const removeThemeFromState = (context: vscode.ExtensionContext, themeString: string, themeProvider: ThemeFavProvider) => {
    // console.log('request to remove ' + themeString)
    let favorites: ThemeExtJSON[] = getFavorites(context)
    let ind = getThemeNameArray(favorites).indexOf(themeString)
    if (ind == -1) return
    favorites.splice(ind, 1)
    context.globalState.update("themeFav_favorites", JSON.stringify(favorites)).then(() => {
        themeProvider.refresh()
        vscode.window.showInformationMessage(themeString + " removed from favorites.")
    })
}
export const activateTheme = (themeString: string) => {
    vscode.commands.executeCommand("workbench.action.selectTheme").then((val: any) => {
        vscode.commands.executeCommand(themeString).then(() => {

        })
    })
}
// HISTORY
export const addHistoryEvent = (context: vscode.ExtensionContext, newHistoryString: string,) => {
    console.log('request to add ' + newHistoryString + " to history.")
    let history = getHistory(context)
    // Check if exists in history
}
// PALLETTE ACTION
export const selectFavorite = (context: vscode.ExtensionContext) => {
    let favs: ThemeExtJSON[] = getFavorites(context)
    let current: ThemeExtJSON = getCurrentTheme()
    let currentIncludedInFavorites = favsIncludes(favs, current)
    // CREATE OPTIONS
    let quickPickItems: vscode.QuickPickItem[] = []
    favs.forEach((val: ThemeExtJSON) => {
        let quickPick: vscode.QuickPickItem = {
            label: val.id? val.id : val.label,
        }
        quickPickItems.push(quickPick)
    })
    // SETUP
    let quickPickAction: vscode.QuickPick<vscode.QuickPickItem> = vscode.window.createQuickPick()
    quickPickAction.items = quickPickItems
    quickPickAction.title = "Select theme."
    // SET ACTIVE IF POSSIBLE
    if (currentIncludedInFavorites) {
        let indexOfCurrent = quickPickItems.map((qp) => {
            return qp.label
        }).indexOf(ThemeExtJSON2.getInterfaceIdentifier(current))
        quickPickAction.activeItems = [quickPickItems[indexOfCurrent]]
    }
    // CALLBACKS
    quickPickAction.onDidAccept(() => {
        const selection = quickPickAction.activeItems[0]
        setThemeActive(selection.label)
        quickPickAction.hide()
    })
    quickPickAction.onDidChangeActive(() => {
        const selection = quickPickAction.activeItems[0]
        setThemeActive(selection.label)
    })
    // ACTIVATE
    quickPickAction.show()
}
export const removeViaCommandPalette = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let favs: ThemeExtJSON[] = getFavorites(context)
    let quickPicks: vscode.QuickPickItem[] = []
    favs.forEach((val: ThemeExtJSON) => {
        let quickPick: vscode.QuickPickItem = {
            label: ThemeExtJSON2.getInterfaceIdentifier(val),
        }
        quickPicks.push(quickPick)
    })
    // SETUP MENU
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = quickPicks
    quickPickAction.title = "Remove theme."
    // SELECT TO REMOVE
    quickPickAction.onDidAccept(() => {
        const selection = quickPickAction.activeItems[0]
        console.log("want to remove " + selection.label)
        removeThemeFromState(context, selection.label, themeProvider)
        quickPickAction.hide()
    })
    quickPickAction.onDidChangeActive(() => {
        const selection = quickPickAction.activeItems[0]
    })
    // ACTIVATE
    quickPickAction.show()
}
export const manageFavoritesViaPallette = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let allThemes: ThemeExtJSON[] = getInstalled()
    let favs: ThemeExtJSON[] = getFavorites(context)
    let quickPickItems: vscode.QuickPickItem[] = allThemes.map((val: ThemeExtJSON)=>{
        let pick: vscode.QuickPickItem = {
            label: ThemeExtJSON2.getInterfaceIdentifier(val),
        }
        return pick
    })
    // CREATE SELECTED LIST 
    let selected = quickPickItems.filter((val: vscode.QuickPickItem) => {
        if(getThemeNameArray(favs).includes(val.label)) return true
        return false
    })
    // SETUP MENU
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = quickPickItems
    quickPickAction.title = "Manage Themes"
    quickPickAction.canSelectMany = true
    quickPickAction.selectedItems = selected
    // NEW FAVS LIST TO SET TO STATE IF ACCEPTED
    let newFavs: ThemeExtJSON[] = []
    //  ACTIONS
    quickPickAction.onDidChangeSelection((e: readonly vscode.QuickPickItem[]) => {
        let installed = getInstalled()
        newFavs = e.map((pick: vscode.QuickPickItem)=> {
            let extJSON = getJSON(installed, pick.label)
            return extJSON
        })
    })
    quickPickAction.onDidAccept(() => {
        updateThemeState(newFavs, context, themeProvider)
        quickPickAction.hide()
    })
     // ACTIVATE
     quickPickAction.show()
}
// TREE VIEW ACTIONS
export const editTheme = (itemContext: ThemeFav, context: vscode.ExtensionContext) => {
    console.log(itemContext)
    let uri = itemContext.theme.uri!
    if(!uri) uri = vscode.Uri.file(itemContext.theme.absPath!)
    vscode.workspace.openTextDocument(uri).then((val: vscode.TextDocument) => {
        vscode.window.showTextDocument(val)
    })
}
export const removeViaView = (themeFav: ThemeFav, context: vscode.ExtensionContext, treeProvider: ThemeFavProvider) => {
    let toRemove: string = themeFav.label
    removeThemeFromState(context, toRemove, treeProvider)
}
export const sortListAlphaAsc = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let favs: ThemeExtJSON[] = getFavorites(context)
    let sorted: ThemeExtJSON[] = sortAlphaAsc(favs)
    context.globalState.update("themeFav_favorites", JSON.stringify(sorted)).then(() => {
        themeProvider.refresh()
    })
}
export const sortListAlphaDesc = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let favs: ThemeExtJSON[] = getFavorites(context)
    let sorted: ThemeExtJSON[] = sortAlphaDesc(favs)
    context.globalState.update("themeFav_favorites", JSON.stringify(sorted)).then(() => {
        themeProvider.refresh()
    })
}

// UTIL
export const setThemeActive = (themeString: string) => {
    let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
    console.log(themeString)
    config.update("workbench.colorTheme", themeString, true).then(()=> console.log('updated'))
}
export const getCurrentTheme = (): ThemeExtJSON => {
    let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
    console.log(config.get("workbench.theme"))
    let theme: string = config.get("workbench.colorTheme")!
    let themeEXT: ThemeExtJSON = getThemeJson(theme)
    return themeEXT
}
export const favsIncludes = (favs: ThemeExtJSON[], themeToCheck: ThemeExtJSON): boolean => {
    if (favs.map((val: ThemeExtJSON) => val.id ? val.id : val.label).indexOf(themeToCheck.id ? themeToCheck.id : themeToCheck.label) === -1) return false
    return true
}
export const getFavIndex = (themes: ThemeExtJSON[], theme: string) => {
    return themes.map((theme: ThemeExtJSON) => ThemeExtJSON2.getInterfaceIdentifier(theme)).indexOf(theme)
}

// ORGANIZATION
export const reorderFav = (context: vscode.ExtensionContext, themeToMove: string, newInd: number) => {
    let themes: ThemeExtJSON[] = getFavorites(context)
    let ind: number = getFavIndex(themes, themeToMove)
    let newArray = [...themes]
    let moving: ThemeExtJSON[] = newArray.splice(ind, 1)
    newArray.splice(newInd, 0, moving[0])
    context.globalState.update('themeFav_favorites', newArray).then(() => {
        vscode.commands.executeCommand("themeFav.refreshTreeView")
    })
}
// SORT UTIL
const sortAlphaDesc = (themes: ThemeExtJSON[]) => {
    return themes.sort((a, b) => ThemeExtJSON2.getInterfaceIdentifier(a) > ThemeExtJSON2.getInterfaceIdentifier(b) ? 1 : -1)
}
const sortAlphaAsc = (themes: ThemeExtJSON[]) => {
    return themes.sort((a, b) => ThemeExtJSON2.getInterfaceIdentifier(a) < ThemeExtJSON2.getInterfaceIdentifier(b) ? 1 : -1)
}
// BASE THEMES
export const getInstalled = (): ThemeExtJSON[] => {
    let ext: vscode.Extension<any>[] = [...vscode.extensions.all]
    let themesArr: any[] = ext.filter((val: vscode.Extension<any>) => {
        if (val.packageJSON.hasOwnProperty("contributes")) return true
        return false
    }).map((val: vscode.Extension<any>) => {
        return val.packageJSON.contributes
    })
    themesArr = themesArr.filter((val: any) => {
        if (val.hasOwnProperty("themes")) return true
        return false
    }).flatMap((val: any) => {
        return val.themes
    }).map((val: any) => {
        return createThemeExtJSON(val.label, val.path, val.uiTheme, val.id ? val.id : null)
    })
    return themesArr
}
export const validateThemes = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let installed: ThemeExtJSON[] = getInstalled()
    let installStrings: string[] = installed.map((val: ThemeExtJSON)=> ThemeExtJSON2.getInterfaceIdentifier(val))
    let favs: ThemeExtJSON[] = getFavorites(context)
    let newFavs: ThemeExtJSON[] = favs.filter((theme: ThemeExtJSON) => {
        if(installStrings.includes(ThemeExtJSON2.getInterfaceIdentifier(theme))) return true
        return false
    })
    // ALERT IF REMOVED
    let diff = favs.length - newFavs.length
    if(diff > 0) vscode.window.showInformationMessage(`Removed ${diff} uninstalled favorites.`)
    // UPDATE GLOBAL STATE
    updateThemeState(newFavs, context, themeProvider)
}
const isInstalled = (themeString: string, allInstalled: ThemeExtJSON[]): boolean => {
    if(allInstalled.map((val: ThemeExtJSON)=> val.id ? val.id : val.label).includes(themeString)) return true
    return false
}
const getThemeJson = (themeString: string): ThemeExtJSON => {
    let installed = getInstalled()
    let index = installed.map((ext: ThemeExtJSON) => {
        return ext.id ? ext.id : ext.label
    }).indexOf(themeString)
    if(index == -1) return createThemeExtJSON(themeString, "", "", null)
    return installed[index]
}
const getJSON = (installed: ThemeExtJSON[], themeString: string): ThemeExtJSON => {
    let index = installed.map((ext: ThemeExtJSON) => {
        return ThemeExtJSON2.getInterfaceIdentifier(ext)
    }).indexOf(themeString)
    if(index == -1) return createThemeExtJSON(themeString, "", "", null)
    return installed[index]
}

const getThemeNameArray = (themes: ThemeExtJSON[]): string[] => {
    return themes.map((theme: ThemeExtJSON) => theme.id ? theme.id : theme.label)
}