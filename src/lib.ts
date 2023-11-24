import * as vscode from 'vscode'
import { ThemeItem, ThemeFavProvider, FolderItem } from './treeviews/TreeViewFavorites'
import { ThemeExtJSON, ThemeExtJSON2, createThemeExtJSON } from './models/ThemeExtJSON'
import { Folder } from './models/Folder'
import { FolderQuickPickItem, ThemeQuickPickItem } from './models/QuickPick'

// BASIC STATE MANAGEMENT
export const resetState = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("themeFav_favorites", "[]").then(()=>{
        themeProvider.refresh()
    })
    context.globalState.update("themeFav_folders", "[]").then(()=>{
        themeProvider.refresh()
    })
}
export const updateUncatFavs = (newFavs: ThemeExtJSON[], context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("themeFav_favorites", JSON.stringify(newFavs)).then(()=>{
        themeProvider.refresh()
    })
}
export const addThemeToUncat = (themeToAdd: ThemeExtJSON, context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let favs: ThemeExtJSON[] = getFavorites(context)
    favs.push(themeToAdd)
    updateUncatFavs(favs, context, themeProvider)
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
    const folderArr: Folder[] = JSON.parse(folderString)
    return folderArr
}
export const renameFolder = (folderItem: FolderItem, context: vscode.ExtensionContext, themeProv: ThemeFavProvider) => {
    const reserved: string[] = ["Installed"]
    // console.log("rename " + folderItem.label)
    const folders: Folder[] = getFolderState(context)
    const index: number = getFolderIndex(folderItem, context, folders)
    let currentName: string = folders[index].label
    const quickPickAction = vscode.window.createInputBox()
    quickPickAction.value = currentName

    // ON CHANGE
    quickPickAction.onDidChangeValue((inputString: string) => {
        currentName = inputString
    })
    // ON ACCEPT
    quickPickAction.onDidAccept(()=>{
        console.log("new name: " + currentName)
        if(reserved.map(s=>s.toLowerCase()).includes(currentName.toLowerCase())) return
        // NEEDS VALIDATION
        folders[index].label = currentName
        updateFolderState(folders, context, themeProv)
        quickPickAction.hide()
    })

    // ACTIVATE
    quickPickAction.show()
}
export const updateFolderCollapse = (folder: FolderItem, context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    const folders: Folder[] = getFolderState(context)
    const index: number = getFolderIndex(folder, context, folders)
    folders[index].open = !folders[index].open
    updateFolderState(folders, context, themeProvider)
}
export const getFolderIndex = (folder: FolderItem, context: vscode.ExtensionContext, folders: Folder[]): number => {
    const folderIds: string[] = folders.map((stateFolder)=>stateFolder.id)
    return folderIds.indexOf(folder.folder.id)

}
export const getFavorites = (context: vscode.ExtensionContext): ThemeExtJSON[] => {
    const state = context.globalState
    let favoriteString: string | undefined = state.get('themeFav_favorites')
    // ATTEMPT TO PARSE
    try {
        JSON.parse(favoriteString!)
    }
    catch (e) {
        favoriteString = "[]"
    }
    if (!favoriteString) favoriteString = "[]"
    const favoriteArray: ThemeExtJSON[] = JSON.parse(favoriteString)
    return favoriteArray
}
export const updateHistoryState = (newHistory: ThemeExtJSON[], context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("themeFav_history", JSON.stringify(newHistory)).then(()=>{
        themeProvider.refresh()
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
    const historyArray: ThemeExtJSON[] = JSON.parse(history)
    console.log(historyArray)
    return historyArray
}
export const saveThemeToUncat = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    const activeTheme: ThemeExtJSON = getCurrentTheme()
    const favoriteArray: ThemeExtJSON[] = getFavorites(context)
    if (favoriteArray.map((theme: ThemeExtJSON) => ThemeExtJSON2.getInterfaceIdentifier(theme)).indexOf(ThemeExtJSON2.getInterfaceIdentifier(activeTheme)) == -1) {
        favoriteArray.push(activeTheme)
    }
    else return
    updateUncatFavs(favoriteArray, context, themeProvider)
}
export const removeThemeFromState = (context: vscode.ExtensionContext, themeString: string, themeProvider: ThemeFavProvider) => {
    // console.log('request to remove ' + themeString)
    const favorites: ThemeExtJSON[] = getFavorites(context)
    const ind = getThemeNameArray(favorites).indexOf(themeString)
    if (ind == -1) return
    favorites.splice(ind, 1)
    context.globalState.update("themeFav_favorites", JSON.stringify(favorites)).then(() => {
        themeProvider.refresh()
        vscode.window.showInformationMessage(themeString + " removed from favorites.")
    })
}
// DELETE BOTH THEMES AND FOLDERS VIA TREEVIEW
export const treeDelete = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, treeItem: vscode.TreeItem) => {
    if(treeItem.hasOwnProperty("folder")){
        const folder: FolderItem = treeItem as FolderItem
        const folders: Folder[] = getFolderState(context)
        let index = getFolderIndex(folder, context, folders)     
        folders.splice(index, 1)
        updateFolderState(folders, context, themeProvider)   
    }
    // IF THEME
    else{
        const themeItem: ThemeItem = treeItem as ThemeItem
        // REMOVE FROM FAVORITES
        if(!themeItem.parent) {
            const favs: ThemeExtJSON[] = getFavorites(context)
            const index = getFavIndex(favs, themeItem.theme.label)
            favs.splice(index, 1)
            updateUncatFavs(favs, context, themeProvider)
        }
        // REMOVE FROM FOLDER
        else{
            const folders: Folder[] = getFolderState(context)
            const folderLabel: string = themeItem.parent.id
            const folderIndex = folders.map((val: Folder) => val.id).indexOf(folderLabel)
            const folder: Folder = folders[folderIndex]
            const themeIndex: number = getFavIndex(folder.themes, themeItem.label)
            folder.themes.splice(themeIndex, 1)
            updateFolderState(folders, context, themeProvider)
        }
    }
} 
// HISTORY
export const addHistoryEvent = (context: vscode.ExtensionContext, newHistoryTheme: ThemeExtJSON, themeProvider: ThemeFavProvider) => {
    const history: ThemeExtJSON[] = getHistory(context)
    // Check if exists in history
    const index: number = history.map((val: ThemeExtJSON)=>val.label).indexOf(newHistoryTheme.label)
    if(index !== -1) history.splice(index, 1)
    history.unshift(newHistoryTheme)
    updateHistoryState(history, context, themeProvider)
}

// PALLETTE ACTION
export const selectFavorite = (context: vscode.ExtensionContext) => {
    const favs: ThemeExtJSON[] = getFavorites(context)
    const current: ThemeExtJSON = getCurrentTheme()
    const currentIncludedInFavorites = favsIncludes(favs, current)
    // CREATE OPTIONS
    const quickPickItems: ThemeQuickPickItem[] = []
    favs.forEach((val: ThemeExtJSON) => {
        const quickPick: ThemeQuickPickItem = {
            label: val.id? val.id : val.label,
            theme: val
        }
        quickPickItems.push(quickPick)
    })
    // SETUP
    const quickPickAction: vscode.QuickPick<ThemeQuickPickItem> = vscode.window.createQuickPick()
    quickPickAction.items = quickPickItems
    quickPickAction.title = "Select theme."
    // SET ACTIVE IF POSSIBLE
    if (currentIncludedInFavorites) {
        const indexOfCurrent = quickPickItems.map((qp) => {
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
    const favs: ThemeExtJSON[] = getFavorites(context)
    const quickPicks: ThemeQuickPickItem[] = []
    favs.forEach((val: ThemeExtJSON) => {
        const quickPick: ThemeQuickPickItem = {
            label: ThemeExtJSON2.getInterfaceIdentifier(val),
            theme: val
        }
        quickPicks.push(quickPick)
    })
    // SETUP MENU
    const quickPickAction = vscode.window.createQuickPick()
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
export const manageMenu = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    const folders: Folder[] = getFolderState(context)
    const quickPicks: (FolderQuickPickItem|vscode.QuickPickItem)[] = folders.map((folder: Folder, index: number) => {
        const pick: FolderQuickPickItem = {
            label: folder.label,
            folder: folder,
            index: index
        }
        return pick
    })
    let uncategorized: vscode.QuickPickItem = {
        label: "Uncategorized"
    }
    quickPicks.push(uncategorized)
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = quickPicks
    quickPickAction.title = "Folder To Manage"

    let selected: vscode.QuickPickItem = uncategorized

    quickPickAction.onDidChangeActive((pick: readonly vscode.QuickPickItem[])=>{
        selected = pick[0]
    })
    quickPickAction.onDidAccept(()=>{
        console.log("manage " + selected)
        if(selected.label === "Uncategorized"){
            manageUncategorizedThemes(context, themeProvider)
        }
        else{
            manageFolder(context, themeProvider, selected as FolderQuickPickItem)
        }
        // quickPickAction.hide()
    })
    // ACTIVATE
    quickPickAction.show()
}
export const manageUncategorizedThemes = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
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
        updateUncatFavs(newFavs, context, themeProvider)
        quickPickAction.hide()
    })
     // ACTIVATE
     quickPickAction.show()
}
export const manageFolder = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, folder: FolderQuickPickItem) => {
    let picks: ThemeQuickPickItem[] = folder.folder.themes.map((theme: ThemeExtJSON) => {
        return {
            label: theme.label,
            theme: theme
        }
    })
    // SETUP MENU
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = picks
    quickPickAction.title = "Manage " + folder.label
    quickPickAction.canSelectMany = true
    quickPickAction.selectedItems = picks
    //@ts-ignore
    quickPickAction.onDidChangeSelection((selected: readonly ThemeQuickPickItem[]) => {
        console.log(selected)
    })
    quickPickAction.onDidAccept(() => {
        // FINALIZE STATE CHANGE

        quickPickAction.hide()
    })
    // ACTIVATE
    quickPickAction.show()
}
export const moveToFolderViaPallette = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, themeItem: ThemeItem) => {
    let oldFolder: Folder|undefined = themeItem.parent
    let folders: Folder[] = getFolderState(context)
    let favs = getFavorites(context)
    // CHECK IF ALREADY IN FOLDERS
    let quickPickItems: FolderQuickPickItem[] = folders.map((val: Folder, index: number)=>{
        let pick: FolderQuickPickItem = {
            label: val.label,
            folder: val,
            index: index
        }
        return pick
    }).filter((fldr: FolderQuickPickItem)=>{
        if(fldr.folder.themes.map((val)=>val.label).includes(themeItem.label)) return false
        return true
    })
    
    // SETUP MENU
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = quickPickItems
    quickPickAction.title = "Choose Folder"
    quickPickAction.onDidAccept(() => {
        let selectedFolder: FolderQuickPickItem = quickPickAction.selectedItems[0] as FolderQuickPickItem
        console.log("need to move " + themeItem.label + " to " + selectedFolder.label)
        // REMOVE FROM OLD FOLDER
        if(!themeItem.parent){
            let index: number = getFavIndex(favs, themeItem.label)
            favs.splice(index, 1)
        }
        else{
            if(!oldFolder) return
            let index: number = folders.map(fldr=>fldr.id).indexOf(oldFolder?.id)
            folders[index].themes.splice(folders[index].themes.map(theme=>theme.label).indexOf(themeItem.theme.label), 1)
        }
        // INSERT INTO NEW
        folders[selectedFolder.index].themes.unshift(themeItem.theme)
        // SAVE STATES
        updateFolderState(folders, context, themeProvider)
        updateUncatFavs(favs, context, themeProvider)
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
export const removeThemeViaTree = (themeFav: ThemeItem, context: vscode.ExtensionContext, treeProvider: ThemeFavProvider) => {
    const toRemove: string = themeFav.label
    removeThemeFromState(context, toRemove, treeProvider)
}
export const sortListAlphaAsc = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    const favs: ThemeExtJSON[] = getFavorites(context)
    const sorted: ThemeExtJSON[] = sortAlphaAsc(favs)
    context.globalState.update("themeFav_favorites", JSON.stringify(sorted)).then(() => {
        themeProvider.refresh()
    })
}
export const sortListAlphaDesc = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    const favs: ThemeExtJSON[] = getFavorites(context)
    const sorted: ThemeExtJSON[] = sortAlphaDesc(favs)
    context.globalState.update("themeFav_favorites", JSON.stringify(sorted)).then(() => {
        themeProvider.refresh()
    })
}
export const moveToUncat = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, themeItem: ThemeItem) => {
    if(!themeItem.parent) return
    const folderID: string = themeItem.parent.id
    const folders: Folder[] = getFolderState(context)
    const index: number = folders.map((folder => folder.id)).indexOf(folderID)
    const folder: Folder = folders[index]
    const themeIndex: number = getFavIndex(folder.themes, themeItem.label)
    const themeToMove = folder.themes.splice(themeIndex, 1)
    addThemeToUncat(themeToMove[0], context, themeProvider)
    updateFolderState(folders, context, themeProvider)
}
export const copyPath = (themeItem: ThemeItem, context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    vscode.env.clipboard.writeText(themeItem.theme.absPath!)
}
// UTIL
export const activateTheme = (theme: ThemeExtJSON) => {
    const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
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
    updateUncatFavs(newFavs, context, themeProvider)
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