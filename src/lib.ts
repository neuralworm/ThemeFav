import { InstalledThemeItem, InstalledThemeProvider } from './treeviews/TreeViewInstalled';
import * as vscode from 'vscode'
import * as fs from 'fs'
import { ThemeItem, ThemeFavProvider, FolderItem } from './treeviews/TreeViewFavorites'
import { IThemeEXT, ThemeExtUtil, CreateThemeExtJSON as CreateThemeEXT } from './models/IThemeExtJSON'
import { IFolder } from './models/IFolder'
import { FolderQuickPickItem, ThemeQuickPickItem } from './models/IQuickPick'
import { Custom } from './lib/custom';
import { MashupThemeProvider } from './treeviews/TreeViewMashups';
import { HistoryDataProvider } from './treeviews/TreeViewHistory';
import { History } from './lib/history';
import { IMashupTheme, createMashupTheme } from './models/IMashupTheme';
import { Folders } from './lib/folders';
import { Favorites } from './lib/favorites';
import { ActiveDataProvider } from './treeviews/TreeViewActive';
import { State } from './lib/state';
// GLOBAL STATE RETRIEVAL
export interface IGlobalState {
    installed: IThemeEXT[],
    uncategorized: IThemeEXT[],
    folders: IFolder[],
    mashup: IMashupTheme,
    history: IThemeEXT[]
}
// BASIC STATE MANAGEMENT
export const resetState = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, mashupProvider: MashupThemeProvider, historyData: HistoryDataProvider) => {
    context.globalState.update("themeFav_favorites", "[]").then(() => {
        context.globalState.update("themeFav_mashup", JSON.stringify(createMashupTheme())).then(() => {
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
export const getGlobalState = (context: vscode.ExtensionContext): IGlobalState => {
    return {
        installed: GetInstalled(),
        uncategorized: Favorites.GetFavorites(context),
        mashup: Custom.getMashupState(context),
        folders: Folders.getFolderState(context),
        history: History.getHistory(context)
    }
}
export const duplicateTheme = (theme: InstalledThemeItem, context: vscode.ExtensionContext): IThemeEXT => {
    const newTheme: IThemeEXT = {
        ...theme.theme, label: theme.theme.label + "_copy"
    }
    return newTheme
}
// DELETE BOTH THEMES AND FOLDERS VIA TREEVIEW
export const treeDelete = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, treeItem: vscode.TreeItem) => {
    if (treeItem.hasOwnProperty("folder")) {
        const folder: FolderItem = treeItem as FolderItem
        const folders: IFolder[] = Folders.getFolderState(context)
        let index = Folders.getFolderIndexFromItem(folder, folders)
        folders.splice(index, 1)
        Folders.updateFolderState(folders, context, themeProvider)
    }
    // IF THEME
    else {
        const themeItem: ThemeItem = treeItem as ThemeItem
        // REMOVE FROM FAVORITES
        if (!themeItem.parent) {
            const favs: IThemeEXT[] = Favorites.GetFavorites(context)
            const index = getThemeIndex(favs, themeItem.theme.label)
            favs.splice(index, 1)
            Favorites.updateUncatFavs(favs, context, themeProvider)
        }
        // REMOVE FROM FOLDER
        else {
            const folders: IFolder[] = Folders.getFolderState(context)
            const folderLabel: string = themeItem.parent.id
            const folderIndex = folders.map((val: IFolder) => val.id).indexOf(folderLabel)
            const folder: IFolder = folders[folderIndex]
            const themeIndex: number = getThemeIndex(folder.items, themeItem.label)
            folder.items.splice(themeIndex, 1)
            Folders.updateFolderState(folders, context, themeProvider)
        }
    }
}


// PALLETTE ACTION
export const selectFavorite = (context: vscode.ExtensionContext, activeDataProvider: ActiveDataProvider) => {
    const favs: IThemeEXT[] = Favorites.GetFavorites(context)
    const current: IThemeEXT = GetCurrentTheme()
    const currentIncludedInFavorites = doesThemesInclude(favs, current)
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
        }).indexOf(ThemeExtUtil.GetInterfaceIdentifier(current))
        quickPickAction.activeItems = [quickPickItems[indexOfCurrent]]
    }
    // CALLBACKS
    quickPickAction.onDidAccept(() => {
        const selection = quickPickAction.activeItems[0]
        ActivateTheme(selection.theme, activeDataProvider, context)
        quickPickAction.hide()
    })
    quickPickAction.onDidChangeActive(() => {
        const selection = quickPickAction.activeItems[0]
        ActivateTheme(selection.theme, activeDataProvider, context)
    })
    // ACTIVATE
    quickPickAction.show()
}
export const removeViaCommandPalette = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    const favs: IThemeEXT[] = Favorites.GetFavorites(context)
    const quickPicks: ThemeQuickPickItem[] = []
    favs.forEach((val: IThemeEXT) => {
        const quickPick: ThemeQuickPickItem = {
            label: ThemeExtUtil.GetInterfaceIdentifier(val),
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
        Favorites.removeThemeFromUncat(context, selection.label, themeProvider)
        quickPickAction.hide()
    })
    quickPickAction.onDidChangeActive(() => {
        const selection = quickPickAction.activeItems[0]
    })
    // ACTIVATE
    quickPickAction.show()
}
export const manageMenu = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    const folders: IFolder[] = Folders.getFolderState(context)
    const quickPicks: (FolderQuickPickItem | vscode.QuickPickItem)[] = folders.map((folder: IFolder, index: number) => {
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
    const allThemes: IThemeEXT[] = GetInstalled()
    const favs: IThemeEXT[] = Favorites.GetFavorites(context)
    const quickPickItems: ThemeQuickPickItem[] = allThemes.map((val: IThemeEXT) => {
        const pick: ThemeQuickPickItem = {
            label: ThemeExtUtil.GetInterfaceIdentifier(val),
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
        Favorites.updateUncatFavs(newFavs, context, themeProvider)
        quickPickAction.hide()
    })
    // ACTIVATE
    quickPickAction.show()
}
export const manageFolder = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, folder: FolderQuickPickItem) => {
    let picks: ThemeQuickPickItem[] = folder.folder.items.map((theme: IThemeEXT) => {
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
        let folders = Folders.getFolderState(context)
        let folderIndex = Folders.getFolderIndex(folder.folder, folders)
        folders[folderIndex].items = selectedThemes
        Folders.updateFolderState(folders, context, themeProvider)
        quickPickAction.hide()
    })
    // ACTIVATE
    quickPickAction.show()
}
export const addToFolderPallette = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, themeItem: InstalledThemeItem) => {
    const folders: IFolder[] = Folders.getFolderState(context)
    console.log(themeItem)
    // CHECK IF ALREADY IN FOLDERS
    const quickPickItems: FolderQuickPickItem[] = folders.map((val: IFolder, index: number) => {
        const pick: FolderQuickPickItem = {
            label: val.label,
            folder: val,
            index: index
        }
        return pick
    }).filter((fldr: FolderQuickPickItem) => {
        if (fldr.folder.items.map((val) => ThemeExtUtil.GetInterfaceIdentifier(val)).includes(themeItem.label)) {
            return false
        }
        return true
    })
    // SETUP MENU
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = quickPickItems
    quickPickAction.title = "Choose Folder"

    quickPickAction.onDidAccept(() => {
        const selected: FolderQuickPickItem = quickPickAction.selectedItems[0] as FolderQuickPickItem
        Folders.addToFolder(themeItem.theme, selected.folder, context, themeProvider)
        quickPickAction.hide()
    })
    // ACTIVATE
    quickPickAction.show()
}
export const moveToFolderViaPallette = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, themeItem: ThemeItem) => {
    const oldFolder: IFolder | undefined = themeItem.parent
    const folders: IFolder[] = Folders.getFolderState(context)
    const favs = Favorites.GetFavorites(context)
    // CHECK IF ALREADY IN FOLDERS
    const quickPickItems: FolderQuickPickItem[] = folders.map((val: IFolder, index: number) => {
        const pick: FolderQuickPickItem = {
            label: val.label,
            folder: val,
            index: index
        }
        return pick
    }).filter((fldr: FolderQuickPickItem) => {
        if (fldr.folder.items.map((val) => val.label).includes(themeItem.label)) return false
        return true
    })
    console.log(quickPickItems)

    // SETUP MENU
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = quickPickItems
    quickPickAction.title = "Choose Folder"
    quickPickAction.onDidAccept(() => {
        let selectedFolder: FolderQuickPickItem = quickPickAction.selectedItems[0] as FolderQuickPickItem
        console.log("need to move " + themeItem.label + " to " + selectedFolder.label)
        // REMOVE FROM OLD FOLDER
        if (!themeItem.parent) {
            let index: number = getThemeIndex(favs, themeItem.label)
            favs.splice(index, 1)
        }
        else {
            if (!oldFolder) return
            let index: number = folders.map(fldr => fldr.id).indexOf(oldFolder?.id)
            folders[index].items.splice(folders[index].items.map(theme => theme.label).indexOf(themeItem.theme.label), 1)
        }
        // INSERT INTO NEW
        folders[selectedFolder.index].items.unshift(themeItem.theme)
        // SAVE STATES
        Folders.updateFolderState(folders, context, themeProvider)
        Favorites.updateUncatFavs(favs, context, themeProvider)
        quickPickAction.hide()
    })
    // ACTIVATE
    quickPickAction.show()
}


export const searchInstalled = (context: vscode.ExtensionContext, dataProvider: InstalledThemeProvider, treeView: vscode.TreeView<InstalledThemeItem>) => {
    vscode.commands.executeCommand(('workbench.action.selectTheme'))
}
// TREE VIEW ACTIONS
export const editThemeJSON = (itemContext: ThemeItem, context: vscode.ExtensionContext) => {
    console.log("EDIT REQUEST:" + itemContext.theme)
    console.log(itemContext.theme.uri?.path)
    console.log(itemContext.theme.path.slice(1))
    let pathString

    const filePath = itemContext.theme.uri?.fsPath;
    if(fs.existsSync(filePath!)){
        pathString = vscode.Uri.parse(itemContext.theme.uri?.path + itemContext.theme.path.slice(1))
    }
   
    vscode.workspace.openTextDocument(pathString!).then((val: vscode.TextDocument) => {
        vscode.window.showTextDocument(val)
    })
}
export const removeThemeViaTree = (themeFav: ThemeItem, context: vscode.ExtensionContext, treeProvider: ThemeFavProvider) => {
    const toRemove: string = themeFav.label
    Favorites.removeThemeFromUncat(context, toRemove, treeProvider)
}

export const moveToUncat = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, themeItem: ThemeItem) => {
    if (!themeItem.parent) return
    const folderID: string = themeItem.parent.id
    const folders: IFolder[] = Folders.getFolderState(context)
    const index: number = folders.map((folder => folder.id)).indexOf(folderID)
    const folder: IFolder = folders[index]
    const themeIndex: number = getThemeIndex(folder.items, themeItem.label)
    const themeToMove = folder.items.splice(themeIndex, 1)
    Favorites.addThemeToUncat(themeToMove[0], context, themeProvider)
    Folders.updateFolderState(folders, context, themeProvider)
}
export const copyPath = (themeItem: ThemeItem, context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    vscode.env.clipboard.writeText(themeItem.theme.absPath!)
}
// UTIL
export const ActivateTheme = async (theme: IThemeEXT, activeDataProvider: ActiveDataProvider, context: vscode.ExtensionContext) => {
    if(activeDataProvider.mashupActive){
        console.log("LEAVING MASHUP MODE")
        await Custom.ResetToDefault(theme ? theme : undefined, context)
        activeDataProvider.mashupActive = false;
        activeDataProvider.refresh()
    }
    else{
        // SET IT
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
        config.update("workbench.colorTheme", ThemeExtUtil.GetInterfaceIdentifier(theme), true).then(() => {
            // Custom.clearConfig()
            activeDataProvider.mashupActive = false
            activeDataProvider.refresh()
        })
    }
}

export const GetCurrentTheme = (): IThemeEXT => {
    let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
    console.log(config.get("workbench.colorTheme"))
    let theme: string = config.get("workbench.colorTheme")!
    let themeEXT: IThemeEXT = GetExtDataFromState(theme)
    return themeEXT
}
export const doesThemesInclude = (favs: IThemeEXT[], themeToCheck: IThemeEXT): boolean => {
    if (favs.map((val: IThemeEXT) => val.id ? val.id : val.label).indexOf(themeToCheck.id ? themeToCheck.id : themeToCheck.label) === -1) return false
    return true
}
export const getThemeIndex = (themes: IThemeEXT[], theme: string) => {
    return themes.map((theme: IThemeEXT) => ThemeExtUtil.GetInterfaceIdentifier(theme)).indexOf(theme)
}

// ORGANIZATION
export const createFolder = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let folders: IFolder[] = Folders.getFolderState(context)
    let count = 0
    let baseName = "New Group"
    let nameToCheck = baseName
    let names = folders.map((folder) => folder.label)
    while (true) {
        if (!names.includes(nameToCheck)) break
        count++
        nameToCheck = baseName + ` ${count}`
    }
    let newFolder = new IFolder([], nameToCheck)
    folders.unshift(newFolder)
    const sorted = Folders.sortFoldersAlpha(folders)
    Folders.updateFolderState(sorted, context, themeProvider)
}
export const reorderFav = (context: vscode.ExtensionContext, themeToMove: string, newInd: number) => {
    let themes: IThemeEXT[] = Favorites.GetFavorites(context)
    let ind: number = getThemeIndex(themes, themeToMove)
    let newArray = [...themes]
    let moving: IThemeEXT[] = newArray.splice(ind, 1)
    newArray.splice(newInd, 0, moving[0])
    context.globalState.update('themeFav_favorites', newArray).then(() => {
        vscode.commands.executeCommand("themeFav.refreshTreeView")
    })
}

// BASE THEMES
export const GetInstalled = (): IThemeEXT[] => {
    let ext: vscode.Extension<any>[] = [...vscode.extensions.all]
    let themesArr: any[] = ext.filter((val: vscode.Extension<any>) => {
        if (val.packageJSON.hasOwnProperty("contributes")) {
            if (val.packageJSON["contributes"].hasOwnProperty("themes")) return true
        }
        return false
    }).map((val: vscode.Extension<any>) => {
        return { ...val.packageJSON.contributes, uri: val.extensionUri, absPath: val.extensionPath, extID: val.id, version: val.packageJSON["version"] }
    })
    themesArr = themesArr.flatMap((val: any) => {
        return val.themes.map((themeObj: any) => {
            // console.log("URI: " + val.uri)
            // console.log("ABSPATH: " + val.absPath)
            return { ...themeObj, uri: val.uri, absPath: val.absPath, extID: val.extID }
        })
    }).map((val: any) => {
        return CreateThemeEXT(val.label, val.path, val.uiTheme, val.version, val.extID, val.id ? val.id : null, val.uri, val.absPath)
    })
    return themesArr
}
export const ValidateThemes = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, installedThemeProvider: InstalledThemeProvider) => {
    // GET ALL INSTALLED AGAIN TO VERIFY AGAINST
    let installed: IThemeEXT[] = GetInstalled()
    // VERIFY
    let installStrings: string[] = installed.map((val: IThemeEXT) => ThemeExtUtil.GetInterfaceIdentifier(val))
    let versionStrings: string[] = installed.map((val: IThemeEXT) => ThemeExtUtil.GetVersionString(val))
    // UNCAT FAVS
    let favs: IThemeEXT[] = Favorites.GetFavorites(context)
    // NEED TO ADD VERSION CHECK
    let newFavs: IThemeEXT[] = favs.filter((theme: IThemeEXT) => {
        if (installStrings.includes(ThemeExtUtil.GetInterfaceIdentifier(theme))) return true
        return false
    })
    // newFavs = ValidateThemeVersions(newFavs, versionStrings)
    // FOLDER FAVES
    let folders: IFolder[] = Folders.getFolderState(context);
    let newFolders: IFolder[] = folders.map((folder: IFolder, index: number) => {
        folder.items = folder.items.filter((theme: IThemeEXT) => {
                if (installStrings.includes(ThemeExtUtil.GetInterfaceIdentifier(theme))) return true
                return false
            }
        )
        return folder
    })
    // ALERT IF REMOVED
    let diff = favs.length - newFavs.length
    if (diff > 0) vscode.window.showInformationMessage(`Removed ${diff} uninstalled favorites.`)
    // UPDATE GLOBAL STATE
    Folders.updateFolderState(newFolders, context, themeProvider)
    Favorites.updateUncatFavs(newFavs, context, themeProvider)
    installedThemeProvider.refresh();
}
const ValidateThemeVersions = (favorites: IThemeEXT[], installed: string[]): IThemeEXT[] => {
    let versionStrings: string[] = []
    favorites.forEach((val: IThemeEXT)=>{
        let versionString: string = val.uri?.fsPath!
        console.log(versionString)
    })
    return favorites
}
const isInstalled = (themeString: string, allInstalled: IThemeEXT[]): boolean => {
    if (allInstalled.map((val: IThemeEXT) => val.id ? val.id : val.label).includes(themeString)) return true
    return false
}
const GetExtDataFromState = (themeString: string): IThemeEXT => {
    let installed: IThemeEXT[] = GetInstalled()
    let index = installed.map((ext: IThemeEXT) => {
        return ThemeExtUtil.GetInterfaceIdentifier(ext)
    }).indexOf(themeString)
    if (index === -1) return CreateThemeEXT(themeString, "", "", "", undefined, null)
    return installed[index]
}
export const getExtData = (installed: IThemeEXT[], themeString: string): IThemeEXT => {
    let index = installed.map((ext: IThemeEXT) => {
        return ThemeExtUtil.GetInterfaceIdentifier(ext)
    }).indexOf(themeString)
    if (index == -1) return CreateThemeEXT(themeString, "", "", "", undefined, null)
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
export const doesFolderInclude = (folder: IFolder, theme: IThemeEXT): boolean => {
    let nameArray: string[] = folder.items.map((themeVal) => themeVal.label)
    if (nameArray.includes(theme.label)) return true
    return false
}

// UNINSTALL THEME EXT
export const uninstallExtension = (themeItem: InstalledThemeItem, installedDataProvider: InstalledThemeProvider, context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let extID: string | undefined = themeItem.theme.extID
    if (!extID) return
    vscode.commands.executeCommand('extension.open', extID).then(() => {
        vscode.commands.executeCommand("workbench.extensions.uninstallExtension", extID).then(() => {
            setTimeout(()=>{
                ValidateThemes(context, themeProvider, installedDataProvider);
                vscode.window.showInformationMessage(`${extID} uninstalled.`)

            },200)
          
        })
    })

}
export const getRandomTheme = (): IThemeEXT => {
    const installed: IThemeEXT[] = GetInstalled()
    const rand = Math.floor(Math.random() * installed.length)
    return installed[rand]
}

// sort an array of IThemeExt by their label alphabetically
export const sortThemes = (themes: IThemeEXT[]): IThemeEXT[] => {
    return themes.sort((a: IThemeEXT, b: IThemeEXT) => {
        if (a.label < b.label) return -1
        if (a.label > b.label) return 1
        return 0
    })
}
/**
 * Retrieves the stored favorites from globalstate and returns them as an array of IThemeEXT objects.
 * @param context The VS Code extension context.
 * @returns An array of IThemeEXT objects representing the favorites.
 */
export const getFavorites = (context: vscode.ExtensionContext): IThemeEXT[] => {
    // Retrieve the stored data from vscode.extension.globalstate for the string "favorites"
    let favorites: IThemeEXT[] = JSON.parse(context.globalState.get("themeFav_favorites") || "[]")
    return favorites
}

