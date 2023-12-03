import * as vscode from 'vscode'
import { IFolder } from '../models/IFolder'
import { FolderItem, ThemeFavProvider as ThemeDataProvider } from '../treeviews/TreeViewFavorites'
import { IThemeEXT } from '../models/IThemeExtJSON'

export namespace Folders {
    export const updateFolderState = (folders: IFolder[], context: vscode.ExtensionContext, themeProvider: ThemeDataProvider) => {
        context.globalState.update("themeFav_folders", JSON.stringify(folders)).then(() => {
            themeProvider.refresh()
        })
    }
    export const getFolderState = (context: vscode.ExtensionContext): IFolder[] => {
        let folderString: string | undefined = context.globalState.get("themeFav_folders")
        // PARSE ATTEMPT
        try {
            JSON.parse(folderString!)
        }
        catch (e) {
            folderString = "[]"
        }
        if (!folderString) folderString = "[]"
        const folderArr: IFolder[] = JSON.parse(folderString)
        return folderArr
    }

    // FOLDER UTIL
    export const renameFolder = (folderItem: FolderItem, context: vscode.ExtensionContext, themeProv: ThemeDataProvider) => {
        const reserved: string[] = ["Installed"]
        // console.log("rename " + folderItem.label)
        const folders: IFolder[] = getFolderState(context)
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
    export const updateFolderCollapse = (folder: FolderItem, context: vscode.ExtensionContext, themeProvider: ThemeDataProvider) => {
        const folders: IFolder[] = getFolderState(context)
        const index: number = getFolderIndexFromItem(folder, folders)
        folders[index].open = !folders[index].open
        updateFolderState(folders, context, themeProvider)
    }
    export const getFolderIndexFromItem = (folder: FolderItem, folders: IFolder[]): number => {
        const folderIds: string[] = folders.map((stateFolder) => stateFolder.id)
        return folderIds.indexOf(folder.folder.id)
    }
    export const getFolderIndex = (folder: IFolder, folders: IFolder[]): number => {
        const folderIds: string[] = folders.map((stateFolder) => stateFolder.id)
        return folderIds.indexOf(folder.id)
    }
    export const addToFolder = (themeToAdd: IThemeEXT, folder: IFolder, context: vscode.ExtensionContext, themeProvider: ThemeDataProvider, index?: number) => {
        const folders: IFolder[] = getFolderState(context)
        const folderIndex: number = getFolderIndex(folder, folders)
        const themeStrings = folders[folderIndex].themes.map((val: IThemeEXT) => val.label)
        if (themeStrings.indexOf(themeToAdd.label) === -1) {
            if (index !== undefined) folders[folderIndex].themes.splice(index, 0, themeToAdd)
            else folders[folderIndex].themes.push(themeToAdd)
            updateFolderState(folders, context, themeProvider)
        }
    }
    export const removeFromFolder = (themeToAdd: IThemeEXT, folder: IFolder, context: vscode.ExtensionContext, themeProvider: ThemeDataProvider) => {
        const folders: IFolder[] = getFolderState(context)
        const folderIndex: number = getFolderIndex(folder, folders)
        const themeStrings = folders[folderIndex].themes.map((val: IThemeEXT) => val.label)
        const themeIndex: number = themeStrings.indexOf(themeToAdd.label)
        if (themeIndex !== -1) {
            folders[folderIndex].themes.splice(themeIndex, 1)
            updateFolderState(folders, context, themeProvider)
        }
    }
    export const getFolderViaID = (id: string, folders: IFolder[]): IFolder => {
        return folders[folders.map((folder)=>folder.id).indexOf(id)]
    }
    export const getFolderIndexViaID = (id: string, folders: IFolder[]): number => {
        return folders.map((folder)=>folder.id).indexOf(id)
    }
    export const reorderFolder = (folderID: string, newIndex: number, context: vscode.ExtensionContext, themeDataProvider: ThemeDataProvider) => {
        const folders: IFolder[] = getFolderState(context)
        const oldIndex: number = getFolderIndexViaID(folderID, folders)
        if(oldIndex === -1) return
        const old: IFolder[] = folders.splice(oldIndex, 1)
        folders.splice(newIndex, 0, old[0])
        updateFolderState(folders, context, themeDataProvider)
    }   
}