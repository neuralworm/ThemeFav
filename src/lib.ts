import * as vscode from 'vscode'
import { ThemeItem, ThemeFavProvider, FolderItem } from './TreeViewProvider'
import { ThemeExtJSON, ThemeExtJSON2, createThemeExtJSON } from './ThemeExtJSON'
import { Folder } from './models/Folder'
import { FolderQuickPickItem, ThemeQuickPickItem } from './models/QuickPick'

// BASIC STATE MANAGEMENT
export const resetState = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("themeFav_favorites", "[]").then(()=>{
        themeProvider.refresh()
    })
}
export const updateThemeState = (newFavs: ThemeExtJSON[], context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("themeFav_favorites", JSON.stringify(newFavs)).then(()=>{
        themeProvider.refresh()
    })
}
export const updateFolderState = (folders: Folder[], context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("themeFav_folders", JSON.stringify(folders)).then(()=>{
        themeProvider.refresh()
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
export const renameFolder = (folderItem: FolderItem, context: vscode.ExtensionContext, themeProv: ThemeFavProvider) => {
    console.log("rename " + folderItem.label)
    let folders: Folder[] = getFolderState(context)
    let index: number = getFolderIndex(folderItem, context, folders)
    let currentName: string = folders[index].label
    let quickPickAction = vscode.window.createInputBox()
    quickPickAction.value = currentName

    // ON CHANGE
    quickPickAction.onDidChangeValue((e: string) => {
        currentName = e
    })
    // ON ACCEPT
    quickPickAction.onDidAccept(()=>{
        console.log("new name: " + currentName)
        // NEEDS VALIDATION
        folders[index].label = currentName
        updateFolderState(folders, context, themeProv)
        quickPickAction.hide()
    })

    // ACTIVATE
    quickPickAction.show()
}
export const updateFolderCollapse = (folder: FolderItem, context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let folders: Folder[] = getFolderState(context)
    let index: number = getFolderIndex(folder, context, folders)
    folders[index].open = !folders[index].open
    updateFolderState(folders, context, themeProvider)
}
export const getFolderIndex = (folder: FolderItem, context: vscode.ExtensionContext, folders: Folder[]): number => {
    let folderIds: string[] = folders.map((stateFolder)=>stateFolder.id)
    return folderIds.indexOf(folder.folder.id)

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
    let activeTheme: ThemeExtJSON = getCurrentTheme()
    let favoriteArray: ThemeExtJSON[] = getFavorites(context)
    if (favoriteArray.map((theme: ThemeExtJSON) => ThemeExtJSON2.getInterfaceIdentifier(theme)).indexOf(ThemeExtJSON2.getInterfaceIdentifier(activeTheme)) == -1) {
        favoriteArray.push(activeTheme)
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

// PALLETTE ACTION
export const selectFavorite = (context: vscode.ExtensionContext) => {
    let favs: ThemeExtJSON[] = getFavorites(context)
    let current: ThemeExtJSON = getCurrentTheme()
    let currentIncludedInFavorites = favsIncludes(favs, current)
    // CREATE OPTIONS
    let quickPickItems: ThemeQuickPickItem[] = []
    favs.forEach((val: ThemeExtJSON) => {
        let quickPick: ThemeQuickPickItem = {
            label: val.id? val.id : val.label,
            theme: val
        }
        quickPickItems.push(quickPick)
    })
    // SETUP
    let quickPickAction: vscode.QuickPick<ThemeQuickPickItem> = vscode.window.createQuickPick()
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
    let quickPicks: ThemeQuickPickItem[] = []
    favs.forEach((val: ThemeExtJSON) => {
        let quickPick: ThemeQuickPickItem = {
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
    let quickPickItems: ThemeQuickPickItem[] = allThemes.map((val: ThemeExtJSON)=>{
        let pick: ThemeQuickPickItem = {
            label: ThemeExtJSON2.getInterfaceIdentifier(val),
            theme: val
        }
        return pick
    })
    // CREATE SELECTED LIST 
    let selected = quickPickItems.filter((val: ThemeQuickPickItem) => {
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
export const moveToFolderViaPallette = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, themeItem: ThemeItem) => {
    let folders: Folder[] = getFolderState(context)
    // CHECK IF ALREADY IN FOLDERS
    let filtered = folders.filter((folder: Folder, index: number) => {
        if(folder.themes.map(val => val.label).includes(themeItem.label)) return false
        return true
    })
    let quickPickItems: FolderQuickPickItem[] = filtered.map((val: Folder, index: number)=>{
        let pick: FolderQuickPickItem = {
            label: val.label,
            folder: val,
            index: index
        }
        return pick
    })
    
    // SETUP MENU
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = quickPickItems
    quickPickAction.title = "Choose Folder"
    quickPickAction.onDidAccept(() => {
        let selectedFolder: FolderQuickPickItem = quickPickAction.selectedItems[0] as FolderQuickPickItem
        console.log("need to move " + themeItem.label + " to " + selectedFolder.label)

        // Modify folder array
        folders[selectedFolder.index].themes.unshift(themeItem.theme)
        // Save to state
        updateFolderState(folders, context, themeProvider)

        quickPickAction.hide()
    })

    // ACTIVATE
    quickPickAction.show()
}
// TREE VIEW ACTIONS
export const editThemeJSON = (itemContext: ThemeItem, context: vscode.ExtensionContext) => {
    console.log(itemContext.theme)
   
    vscode.workspace.openTextDocument(vscode.Uri.parse(itemContext.theme.uri?.path + itemContext.theme.path.slice(1))).then((val: vscode.TextDocument) => {
        vscode.window.showTextDocument(val)
    })
}
export const removeViaView = (themeFav: ThemeItem, context: vscode.ExtensionContext, treeProvider: ThemeFavProvider) => {
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
    config.update("workbench.colorTheme", ThemeExtJSON2.getInterfaceIdentifier(theme), true).then(()=> {
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
    let count = 0
    let baseName = "New Group"
    let nameToCheck = baseName
    let names = folders.map((folder) => folder.label)
    while(true){
        if(!names.includes(nameToCheck)) break
        count++
        nameToCheck = baseName + ` ${count}`
    }
    let newFolder = new Folder([], nameToCheck)
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