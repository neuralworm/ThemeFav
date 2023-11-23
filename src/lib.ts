import * as vscode from 'vscode'
import { ThemeFav, ThemeFavProvider } from './TreeViewProvider'
import { ThemeExtJSON, ThemeExtJSON2, createThemeExtJSON } from './ThemeExtJSON'
import { Folder } from './models/Folder'

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
export const updateFolderState = (folders: Folder[], context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("themeFav_folders", JSON.stringify(folders)).then(()=>{
        themeProvider.refresh()
        console.log("Folders " + JSON.stringify(getFolderState(context)))
    })
}
export const getFolderState = (context: vscode.ExtensionContext): Folder[] => {
    let folderString: string | undefined = context.globalState.get("themeFav_folders")
    // PARSE ATTEMPT
    try {
        JSON.parse(folderString!)
    }
    catch (e) {
        folderString = "[]"
    }
    if(!folderString) folderString = "[]"
    let folderArr: Folder[] = JSON.parse(folderString)
    return folderArr
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
export const updateHistoryState = (newHistory: ThemeExtJSON[], context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("themeFav_history", JSON.stringify(newHistory)).then(()=>{
        themeProvider.refresh()
        console.log(getHistory(context))
    })
}
export const getHistory = (context: vscode.ExtensionContext): ThemeExtJSON[] => {
    let history: string | undefined = context.globalState.get("themeFav_history")
    try {
        JSON.parse(history!)
    }
    catch (e) {
        history = "[]"
    }
    if (!history) history = "[]"
    let historyArray: ThemeExtJSON[] = JSON.parse(history)
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
// HISTORY
export const addHistoryEvent = (context: vscode.ExtensionContext, newHistoryTheme: ThemeExtJSON, themeProvider: ThemeFavProvider) => {
    console.log('request to add ' + newHistoryTheme.label + " to history.")
    let history: ThemeExtJSON[] = getHistory(context)
    console.log('history : ' + history)
    // Check if exists in history
    let index = history.map((val: ThemeExtJSON)=>val.label).indexOf(newHistoryTheme.label)
    if(index !== -1) history.splice(index, 1)
    history.unshift(newHistoryTheme)
    updateHistoryState(history, context, themeProvider)
}
class CustomQuickPick implements vscode.QuickPickItem{
    label: string
    theme: ThemeExtJSON
    constructor(label: string, theme: ThemeExtJSON){
        this.label = label
        this.theme = theme
    }
}
// PALLETTE ACTION
export const selectFavorite = (context: vscode.ExtensionContext) => {
    let favs: ThemeExtJSON[] = getFavorites(context)
    let current: ThemeExtJSON = getCurrentTheme()
    let currentIncludedInFavorites = favsIncludes(favs, current)
    // CREATE OPTIONS
    let quickPickItems: CustomQuickPick[] = []
    favs.forEach((val: ThemeExtJSON) => {
        let quickPick: CustomQuickPick = {
            label: val.id? val.id : val.label,
            theme: val
        }
        quickPickItems.push(quickPick)
    })
    // SETUP
    let quickPickAction: vscode.QuickPick<CustomQuickPick> = vscode.window.createQuickPick()
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
        activateTheme(selection.theme)
        quickPickAction.hide()
    })
    quickPickAction.onDidChangeActive(() => {
        const selection = quickPickAction.activeItems[0]
        activateTheme(selection.theme)
    })
    // ACTIVATE
    quickPickAction.show()
}
export const removeViaCommandPalette = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let favs: ThemeExtJSON[] = getFavorites(context)
    let quickPicks: CustomQuickPick[] = []
    favs.forEach((val: ThemeExtJSON) => {
        let quickPick: CustomQuickPick = {
            label: ThemeExtJSON2.getInterfaceIdentifier(val),
            theme: val
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
    let quickPickItems: CustomQuickPick[] = allThemes.map((val: ThemeExtJSON)=>{
        let pick: CustomQuickPick = {
            label: ThemeExtJSON2.getInterfaceIdentifier(val),
            theme: val
        }
        return pick
    })
    // CREATE SELECTED LIST 
    let selected = quickPickItems.filter((val: CustomQuickPick) => {
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
        newFavs = e.map((pick: vscode.QuickPickItem)=> {
            let extJSON = getJSON(allThemes, pick.label)
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
export const editThemeJSON = (itemContext: ThemeFav, context: vscode.ExtensionContext) => {
    console.log(itemContext.theme)
   
    vscode.workspace.openTextDocument(vscode.Uri.parse(itemContext.theme.uri?.path + itemContext.theme.path.slice(1))).then((val: vscode.TextDocument) => {
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
export const activateTheme = (theme: ThemeExtJSON) => {
    let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
    console.log(theme.label)
    config.update("workbench.colorTheme", theme.label, true).then(()=> {
    })
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
export const createFolder = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let folders: Folder[] = getFolderState(context)
    let newFolder = new Folder([], "New Favorites")
    folders.unshift(newFolder)
    updateFolderState(folders, context, themeProvider)
}
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
        return {...val.packageJSON.contributes, uri: val.extensionUri, absPath: val.extensionPath}
    })
    themesArr = themesArr.filter((val: any) => {
        if (val.hasOwnProperty("themes")) return true
        return false
    }).flatMap((val: any) => {
        return val.themes.map((themeObj:any)=>{
            return {...themeObj, uri: val.uri, absPath: val.absPath}
        })
    }).map((val: any) => {
        return createThemeExtJSON(val.label, val.path, val.uiTheme, val.id ? val.id : null, val.uri, val.absPath)
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
    let installed: ThemeExtJSON[] = getInstalled()
    let index = installed.map((ext: ThemeExtJSON) => {
        return ext.id ? ext.id : ext.label
    }).indexOf(themeString)
    if(index == -1) return createThemeExtJSON(themeString, "", "", null, )
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