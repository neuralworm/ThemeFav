import { InstalledThemeItem, InstalledThemeProvider } from './treeviews/TreeViewInstalled';
import * as vscode from 'vscode'
import { ThemeItem, ThemeFavProvider, FolderItem } from './treeviews/TreeViewFavorites'
import { IThemeEXT, ThemeExtUtil, createThemeExtJSON as createThemeEXT } from './models/ThemeExtJSON'
import { Folder } from './models/Folder'
import { FolderQuickPickItem, ThemeQuickPickItem } from './models/QuickPick'
import { Custom } from './lib/custom';
import { MashupThemeProvider } from './treeviews/TreeViewMashups';
import { HistoryDataProvider } from './treeviews/TreeViewHistory';
import { readFileSync } from 'fs';
import path = require('path');
import { jsonrepair } from 'jsonrepair';
import { IMashupTheme } from './models/MashupTheme';

// BASIC STATE MANAGEMENT
export const resetState = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, mashupProvider: MashupThemeProvider, historyData: HistoryDataProvider) => {
    context.globalState.update("themeFav_favorites", "[]").then(() => {
        context.globalState.update("themeFav_mashup", "{}").then(() => {
            context.globalState.update("themeFav_folders", "[]").then(() => {
                context.globalState.update("themeFav_history", "[]").then(() => {
                    historyData.refresh()
                    themeProvider.refresh()
                    mashupProvider.refresh()
                })
            })
        })
    })
}
export const updateUncatFavs = (newFavs: IThemeEXT[], context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("themeFav_favorites", JSON.stringify(newFavs)).then(() => {
        themeProvider.refresh()
    })
}
export const addThemeToUncat = (themeToAdd: IThemeEXT, context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, index?: number) => {
    let favs: IThemeEXT[] = getFavorites(context)
    let doesExist: boolean = doesInclude(favs, themeToAdd)
    if (doesExist) return
    if (index !== undefined) {
        favs.splice(index, 0, themeToAdd)
    }
    else favs.push(themeToAdd)
    updateUncatFavs(favs, context, themeProvider)
}
export const updateFolderState = (folders: Folder[], context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("themeFav_folders", JSON.stringify(folders)).then(() => {
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
    if (!folderString) folderString = "[]"
    const folderArr: Folder[] = JSON.parse(folderString)
    return folderArr
}
export interface IGlobalState{
    installed: IThemeEXT[],
    uncategorized: IThemeEXT[],
    folders: Folder[],
    mashup: IMashupTheme,
    history: IThemeEXT[]
}
export const getGlobalState = (context: vscode.ExtensionContext): IGlobalState => {
    return{
        installed: getInstalled(),
        uncategorized: getFavorites(context),
        mashup: Custom.getMashupState(context),
        folders: getFolderState(context),
        history: getHistory(context)
    }
}


// FOLDER UTIL
export const renameFolder = (folderItem: FolderItem, context: vscode.ExtensionContext, themeProv: ThemeFavProvider) => {
    const reserved: string[] = ["Installed"]
    // console.log("rename " + folderItem.label)
    const folders: Folder[] = getFolderState(context)
    const index: number = getFolderIndexFromItem(folderItem, folders)
    let currentName: string = folders[index].label
    const quickPickAction = vscode.window.createInputBox()
    quickPickAction.value = currentName

    // ON CHANGE
    quickPickAction.onDidChangeValue((inputString: string) => {
        currentName = inputString
    })
    // ON ACCEPT
    quickPickAction.onDidAccept(() => {
        console.log("new name: " + currentName)
        if (reserved.map(s => s.toLowerCase()).includes(currentName.toLowerCase())) return
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
    const index: number = getFolderIndexFromItem(folder, folders)
    folders[index].open = !folders[index].open
    updateFolderState(folders, context, themeProvider)
}
export const getFolderIndexFromItem = (folder: FolderItem, folders: Folder[]): number => {
    const folderIds: string[] = folders.map((stateFolder) => stateFolder.id)
    return folderIds.indexOf(folder.folder.id)
}
export const getFolderIndex = (folder: Folder, folders: Folder[]): number => {
    const folderIds: string[] = folders.map((stateFolder) => stateFolder.id)
    return folderIds.indexOf(folder.id)
}
export const getFavorites = (context: vscode.ExtensionContext): IThemeEXT[] => {
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
    const favoriteArray: IThemeEXT[] = JSON.parse(favoriteString)
    return favoriteArray
}
export const updateHistoryState = (newHistory: IThemeEXT[], context: vscode.ExtensionContext, historyProvider: HistoryDataProvider) => {
    context.globalState.update("themeFav_history", JSON.stringify(newHistory)).then((val) => {
        historyProvider.refresh()
    })
}
export const getHistory = (context: vscode.ExtensionContext): IThemeEXT[] => {
    let history: string | undefined = context.globalState.get("themeFav_history")
    try {
        JSON.parse(history!)
    }
    catch (e) {
        history = "[]"
    }
    if (!history) history = "[]"
    const historyArray: IThemeEXT[] = JSON.parse(history)
    return historyArray
}
export const saveThemeToUncat = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    const activeTheme: IThemeEXT = getCurrentTheme()
    const favoriteArray: IThemeEXT[] = getFavorites(context)
    if (favoriteArray.map((theme: IThemeEXT) => ThemeExtUtil.getInterfaceIdentifier(theme)).indexOf(ThemeExtUtil.getInterfaceIdentifier(activeTheme)) == -1) {
        favoriteArray.push(activeTheme)
    }
    else return
    updateUncatFavs(favoriteArray, context, themeProvider)
}
export const removeThemeFromUncat = (context: vscode.ExtensionContext, themeString: string, themeProvider: ThemeFavProvider) => {
    // console.log('request to remove ' + themeString)
    const favorites: IThemeEXT[] = getFavorites(context)
    const ind = getThemeNameArray(favorites).indexOf(themeString)
    if (ind == -1) return
    favorites.splice(ind, 1)
    context.globalState.update("themeFav_favorites", JSON.stringify(favorites)).then(() => {
        themeProvider.refresh()
    })
}
export const duplicateTheme = (theme: InstalledThemeItem, context: vscode.ExtensionContext) => {
    const newTheme: IThemeEXT = {
        ...theme.theme, label: theme.theme.label + "_copy"
    }
    return newTheme
}
// DELETE BOTH THEMES AND FOLDERS VIA TREEVIEW
export const treeDelete = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, treeItem: vscode.TreeItem) => {
    if (treeItem.hasOwnProperty("folder")) {
        const folder: FolderItem = treeItem as FolderItem
        const folders: Folder[] = getFolderState(context)
        let index = getFolderIndexFromItem(folder, folders)
        folders.splice(index, 1)
        updateFolderState(folders, context, themeProvider)
    }
    // IF THEME
    else {
        const themeItem: ThemeItem = treeItem as ThemeItem
        // REMOVE FROM FAVORITES
        if (!themeItem.parent) {
            const favs: IThemeEXT[] = getFavorites(context)
            const index = getFavIndex(favs, themeItem.theme.label)
            favs.splice(index, 1)
            updateUncatFavs(favs, context, themeProvider)
        }
        // REMOVE FROM FOLDER
        else {
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
export const addHistoryEvent = (context: vscode.ExtensionContext, newHistoryTheme: IThemeEXT, HistoryDataProvider: HistoryDataProvider) => {
    const history: IThemeEXT[] = getHistory(context)
    // Check if exists in history
    const index: number = history.map((val: IThemeEXT) => val.label).indexOf(newHistoryTheme.label)
    if (index !== -1) history.splice(index, 1)
    history.unshift(newHistoryTheme)
    if (history.length > 40) history.pop()
    updateHistoryState(history, context, HistoryDataProvider)
}

// PALLETTE ACTION
export const selectFavorite = (context: vscode.ExtensionContext) => {
    const favs: IThemeEXT[] = getFavorites(context)
    const current: IThemeEXT = getCurrentTheme()
    const currentIncludedInFavorites = favsIncludes(favs, current)
    // CREATE OPTIONS
    const quickPickItems: ThemeQuickPickItem[] = []
    favs.forEach((val: IThemeEXT) => {
        const quickPick: ThemeQuickPickItem = {
            label: val.id ? val.id : val.label,
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
        }).indexOf(ThemeExtUtil.getInterfaceIdentifier(current))
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
    const favs: IThemeEXT[] = getFavorites(context)
    const quickPicks: ThemeQuickPickItem[] = []
    favs.forEach((val: IThemeEXT) => {
        const quickPick: ThemeQuickPickItem = {
            label: ThemeExtUtil.getInterfaceIdentifier(val),
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
        removeThemeFromUncat(context, selection.label, themeProvider)
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
    const quickPicks: (FolderQuickPickItem | vscode.QuickPickItem)[] = folders.map((folder: Folder, index: number) => {
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

    quickPickAction.onDidChangeActive((pick: readonly vscode.QuickPickItem[]) => {
        selected = pick[0]
    })
    quickPickAction.onDidAccept(() => {
        console.log("manage " + selected)
        if (selected.label === "Uncategorized") {
            manageUncategorizedThemes(context, themeProvider)
        }
        else {
            manageFolder(context, themeProvider, selected as FolderQuickPickItem)
        }
        // quickPickAction.hide()
    })
    // ACTIVATE
    quickPickAction.show()
}
export const manageUncategorizedThemes = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    const allThemes: IThemeEXT[] = getInstalled()
    const favs: IThemeEXT[] = getFavorites(context)
    const quickPickItems: ThemeQuickPickItem[] = allThemes.map((val: IThemeEXT) => {
        const pick: ThemeQuickPickItem = {
            label: ThemeExtUtil.getInterfaceIdentifier(val),
            theme: val
        }
        return pick
    })
    // CREATE SELECTED LIST 
    let selected = quickPickItems.filter((val: ThemeQuickPickItem) => {
        if (getThemeNameArray(favs).includes(val.label)) return true
        return false
    })
    // SETUP MENU
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = quickPickItems
    quickPickAction.title = "Manage Themes"
    quickPickAction.canSelectMany = true
    quickPickAction.selectedItems = selected
    // NEW FAVS LIST TO SET TO STATE IF ACCEPTED
    let newFavs: IThemeEXT[] = []
    //  ACTIONS
    quickPickAction.onDidChangeSelection((e: readonly vscode.QuickPickItem[]) => {
        newFavs = e.map((pick: vscode.QuickPickItem) => {
            let extJSON = getExtData(allThemes, pick.label)
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
    let picks: ThemeQuickPickItem[] = folder.folder.themes.map((theme: IThemeEXT) => {
        return {
            label: theme.label,
            theme: theme
        }
    })
    // SETUP MENU
    const quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = picks
    quickPickAction.title = "Manage " + folder.label
    quickPickAction.canSelectMany = true
    quickPickAction.selectedItems = picks
    let selectedThemes: IThemeEXT[] = picks.map((val) => val.theme)
    //@ts-ignore
    quickPickAction.onDidChangeSelection((selected: readonly ThemeQuickPickItem[]) => {
        selectedThemes = selected.map((val) => val.theme)
    })
    quickPickAction.onDidAccept(() => {
        // FINALIZE STATE CHANGE
        let folders = getFolderState(context)
        let folderIndex = getFolderIndex(folder.folder, folders)
        folders[folderIndex].themes = selectedThemes
        updateFolderState(folders, context, themeProvider)
        quickPickAction.hide()
    })
    // ACTIVATE
    quickPickAction.show()
}
export const addToFolderPallette = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, themeItem: ThemeItem) => {
    const oldFolder: Folder | undefined = themeItem.parent
    const folders: Folder[] = getFolderState(context)
    const favs = getFavorites(context)
    // CHECK IF ALREADY IN FOLDERS
    const quickPickItems: FolderQuickPickItem[] = folders.map((val: Folder, index: number) => {
        const pick: FolderQuickPickItem = {
            label: val.label,
            folder: val,
            index: index
        }
        return pick
    }).filter((fldr: FolderQuickPickItem) => {
        if (fldr.folder.themes.map((val) => val.label).includes(themeItem.label)) return false
        return true
    })
    // SETUP MENU
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = quickPickItems
    quickPickAction.title = "Choose Folder"

    quickPickAction.onDidAccept(() => {
        const selected: FolderQuickPickItem = quickPickAction.selectedItems[0] as FolderQuickPickItem
        addToFolder(themeItem.theme, selected.folder, context, themeProvider)
        quickPickAction.hide()
    })


    // ACTIVATE
    quickPickAction.show()
}
export const moveToFolderViaPallette = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, themeItem: ThemeItem) => {
    const oldFolder: Folder | undefined = themeItem.parent
    const folders: Folder[] = getFolderState(context)
    const favs = getFavorites(context)
    // CHECK IF ALREADY IN FOLDERS
    const quickPickItems: FolderQuickPickItem[] = folders.map((val: Folder, index: number) => {
        const pick: FolderQuickPickItem = {
            label: val.label,
            folder: val,
            index: index
        }
        return pick
    }).filter((fldr: FolderQuickPickItem) => {
        if (fldr.folder.themes.map((val) => val.label).includes(themeItem.label)) return false
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
        if (!themeItem.parent) {
            let index: number = getFavIndex(favs, themeItem.label)
            favs.splice(index, 1)
        }
        else {
            if (!oldFolder) return
            let index: number = folders.map(fldr => fldr.id).indexOf(oldFolder?.id)
            folders[index].themes.splice(folders[index].themes.map(theme => theme.label).indexOf(themeItem.theme.label), 1)
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
export const addToFolder = (themeToAdd: IThemeEXT, folder: Folder, context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, index?: number) => {
    const folders: Folder[] = getFolderState(context)
    const folderIndex: number = getFolderIndex(folder, folders)
    const themeStrings = folders[folderIndex].themes.map((val: IThemeEXT) => val.label)
    if (themeStrings.indexOf(themeToAdd.label) === -1) {
        if (index !== undefined) folders[folderIndex].themes.splice(index, 0, themeToAdd)
        else folders[folderIndex].themes.push(themeToAdd)
        updateFolderState(folders, context, themeProvider)
    }
}
export const removeFromFolder = (themeToAdd: IThemeEXT, folder: Folder, context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    const folders: Folder[] = getFolderState(context)
    const folderIndex: number = getFolderIndex(folder, folders)
    const themeStrings = folders[folderIndex].themes.map((val: IThemeEXT) => val.label)
    const themeIndex: number = themeStrings.indexOf(themeToAdd.label)
    if (themeIndex !== -1) {
        folders[folderIndex].themes.splice(themeIndex, 1)
        updateFolderState(folders, context, themeProvider)
    }
}
export const searchInstalled = (context: vscode.ExtensionContext, dataProvider: InstalledThemeProvider, treeView: vscode.TreeView<InstalledThemeItem>) => {
    vscode.commands.executeCommand(('workbench.action.selectTheme'))
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
    removeThemeFromUncat(context, toRemove, treeProvider)
}

export const moveToUncat = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, themeItem: ThemeItem) => {
    if (!themeItem.parent) return
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
export const activateTheme = (theme: IThemeEXT) => {
    const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
    config.update("workbench.colorTheme", ThemeExtUtil.getInterfaceIdentifier(theme), true).then(() => {
        Custom.clearConfig()
    })
}
export const getCurrentTheme = (): IThemeEXT => {
    let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
    console.log(config.get("workbench.colorTheme"))
    let theme: string = config.get("workbench.colorTheme")!
    let themeEXT: IThemeEXT = getExtDataFromState(theme)
    return themeEXT
}
export const favsIncludes = (favs: IThemeEXT[], themeToCheck: IThemeEXT): boolean => {
    if (favs.map((val: IThemeEXT) => val.id ? val.id : val.label).indexOf(themeToCheck.id ? themeToCheck.id : themeToCheck.label) === -1) return false
    return true
}
export const getFavIndex = (themes: IThemeEXT[], theme: string) => {
    return themes.map((theme: IThemeEXT) => ThemeExtUtil.getInterfaceIdentifier(theme)).indexOf(theme)
}

// ORGANIZATION
export const createFolder = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let folders: Folder[] = getFolderState(context)
    let count = 0
    let baseName = "New Group"
    let nameToCheck = baseName
    let names = folders.map((folder) => folder.label)
    while (true) {
        if (!names.includes(nameToCheck)) break
        count++
        nameToCheck = baseName + ` ${count}`
    }
    let newFolder = new Folder([], nameToCheck)
    folders.unshift(newFolder)
    updateFolderState(folders, context, themeProvider)
}
export const reorderFav = (context: vscode.ExtensionContext, themeToMove: string, newInd: number) => {
    let themes: IThemeEXT[] = getFavorites(context)
    let ind: number = getFavIndex(themes, themeToMove)
    let newArray = [...themes]
    let moving: IThemeEXT[] = newArray.splice(ind, 1)
    newArray.splice(newInd, 0, moving[0])
    context.globalState.update('themeFav_favorites', newArray).then(() => {
        vscode.commands.executeCommand("themeFav.refreshTreeView")
    })
}

// BASE THEMES
export const getInstalled = (): IThemeEXT[] => {
    let ext: vscode.Extension<any>[] = [...vscode.extensions.all]
    let themesArr: any[] = ext.filter((val: vscode.Extension<any>) => {
        if (val.packageJSON.hasOwnProperty("contributes")) {
            if (val.packageJSON["contributes"].hasOwnProperty("themes")) return true
        }
        return false
    }).map((val: vscode.Extension<any>) => {
        return { ...val.packageJSON.contributes, uri: val.extensionUri, absPath: val.extensionPath, extID: val.id }
    })
    themesArr = themesArr.flatMap((val: any) => {
        return val.themes.map((themeObj: any) => {
            return { ...themeObj, uri: val.uri, absPath: val.absPath, extID: val.extID }
        })
    }).map((val: any) => {
        return createThemeEXT(val.label, val.path, val.uiTheme, val.extID, val.id ? val.id : null, val.uri, val.absPath)
    })
    return themesArr
}
export const validateThemes = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let installed: IThemeEXT[] = getInstalled()
    let installStrings: string[] = installed.map((val: IThemeEXT) => ThemeExtUtil.getInterfaceIdentifier(val))
    let favs: IThemeEXT[] = getFavorites(context)
    let newFavs: IThemeEXT[] = favs.filter((theme: IThemeEXT) => {
        if (installStrings.includes(ThemeExtUtil.getInterfaceIdentifier(theme))) return true
        return false
    })
    // ALERT IF REMOVED
    let diff = favs.length - newFavs.length
    if (diff > 0) vscode.window.showInformationMessage(`Removed ${diff} uninstalled favorites.`)
    // UPDATE GLOBAL STATE
    updateUncatFavs(newFavs, context, themeProvider)
}
const isInstalled = (themeString: string, allInstalled: IThemeEXT[]): boolean => {
    if (allInstalled.map((val: IThemeEXT) => val.id ? val.id : val.label).includes(themeString)) return true
    return false
}
const getExtDataFromState = (themeString: string): IThemeEXT => {
    let installed: IThemeEXT[] = getInstalled()
    let index = installed.map((ext: IThemeEXT) => {
        return ext.id ? ext.id : ext.label
    }).indexOf(themeString)
    if (index === -1) return createThemeEXT(themeString, "", "", undefined, null)
    return installed[index]
}
export const getExtData = (installed: IThemeEXT[], themeString: string): IThemeEXT => {
    let index = installed.map((ext: IThemeEXT) => {
        return ThemeExtUtil.getInterfaceIdentifier(ext)
    }).indexOf(themeString)
    if (index == -1) return createThemeEXT(themeString, "", "", undefined, null)
    return installed[index]
}

export const getThemeNameArray = (themes: IThemeEXT[]): string[] => {
    return themes.map((theme: IThemeEXT) => theme.id ? theme.id : theme.label)
}
export const doesInclude = (list: IThemeEXT[], theme: IThemeEXT): boolean => {
    let nameArray: string[] = list.map((themeVal) => themeVal.label)
    if (nameArray.includes(theme.label)) return true
    return false
}
export const doesFolderInclude = (folder: Folder, theme: IThemeEXT): boolean => {
    let nameArray: string[] = folder.themes.map((themeVal) => themeVal.label)
    if (nameArray.includes(theme.label)) return true
    return false
}

// UNINSTALL THEME EXT
export const uninstallExtension = (themeItem: InstalledThemeItem, installedDataProvider: InstalledThemeProvider) => {
    let extID: string|undefined = themeItem.theme.extID
    if(!extID) return
    vscode.commands.executeCommand("workbench.extensions.uninstallExtension", extID).then(()=>{
        vscode.window.showInformationMessage(`${extID} uninstalled.`)
        installedDataProvider.refresh()
    })
}
