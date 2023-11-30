import { getFavorites, getFolderIndex, getFolderState, updateFolderState } from "../lib"
import { Folder } from "../models/Folder"
import { IThemeEXT, ThemeExtUtil } from "../models/ThemeExtJSON"
import { FolderItem, ThemeFavProvider } from "../treeviews/TreeViewFavorites"
import * as vscode from 'vscode'

export namespace Sort {
    export const sortListAlphaAsc = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
        const favs: IThemeEXT[] = getFavorites(context)
        const sorted: IThemeEXT[] = sortAlphaAsc(favs)
        context.globalState.update("themeFav_favorites", JSON.stringify(sorted)).then(() => {
            themeProvider.refresh()
        })
    }
    export const sortListAlphaDesc = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
        const favs: IThemeEXT[] = getFavorites(context)
        const sorted: IThemeEXT[] = sortAlphaDesc(favs)
        context.globalState.update("themeFav_favorites", JSON.stringify(sorted)).then(() => {
            themeProvider.refresh()
        })
    }
    export const sortFolderAlphaAsc = (context: vscode.ExtensionContext, folderItem: FolderItem, dataProvider: ThemeFavProvider) => {
        const folders: Folder[] = getFolderState(context)
        const index = getFolderIndex(folderItem.folder, folders)
        folders[index].themes = sortAlphaAsc(folders[index].themes)
        updateFolderState(folders, context, dataProvider)
    }
    export const sortFolderAlphaDesc = (context: vscode.ExtensionContext, folderItem: FolderItem, dataProvider: ThemeFavProvider) => {
        const folders: Folder[] = getFolderState(context)
        const index = getFolderIndex(folderItem.folder, folders)
        folders[index].themes = sortAlphaDesc(folders[index].themes)
        updateFolderState(folders, context, dataProvider)
    }
    const sortAlphaDesc = (themes: IThemeEXT[]) => {
        return themes.sort((a, b) => ThemeExtUtil.getInterfaceIdentifier(a) > ThemeExtUtil.getInterfaceIdentifier(b) ? 1 : -1)
    }
    const sortAlphaAsc = (themes: IThemeEXT[]) => {
        return themes.sort((a, b) => ThemeExtUtil.getInterfaceIdentifier(a) < ThemeExtUtil.getInterfaceIdentifier(b) ? 1 : -1)
    }
}
