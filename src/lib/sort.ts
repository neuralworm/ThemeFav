import { Folders } from "./folders"
import { IFolder } from "../models/IFolder"
import { IThemeEXT, ThemeExtUtil } from "../models/IThemeExtJSON"
import { FolderItem, ThemeFavProvider } from "../treeviews/TreeViewFavorites"
import * as vscode from 'vscode'
import { Favorites } from "./favorites"
export namespace Sort {
    export const sortListAlphaAsc = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
        const favs: IThemeEXT[] = Favorites.getFavorites(context)
        const sorted: IThemeEXT[] = sortAlphaAsc(favs)
        context.globalState.update("themeFav_favorites", JSON.stringify(sorted)).then(() => {
            themeProvider.refresh()
        })
    }
    export const sortListAlphaDesc = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
        const favs: IThemeEXT[] = Favorites.getFavorites(context)
        const sorted: IThemeEXT[] = sortAlphaDesc(favs)
        context.globalState.update("themeFav_favorites", JSON.stringify(sorted)).then(() => {
            themeProvider.refresh()
        })
    }
    export const sortFolderAlphaAsc = (context: vscode.ExtensionContext, folderItem: FolderItem, dataProvider: ThemeFavProvider) => {
        const folders: IFolder[] = Folders.getFolderState(context)
        const index = Folders.getFolderIndex(folderItem.folder, folders)
        folders[index].themes = sortAlphaAsc(folders[index].themes)
        Folders.updateFolderState(folders, context, dataProvider)
    }
    export const sortFolderAlphaDesc = (context: vscode.ExtensionContext, folderItem: FolderItem, dataProvider: ThemeFavProvider) => {
        const folders: IFolder[] = Folders.getFolderState(context)
        const index = Folders.getFolderIndex(folderItem.folder, folders)
        folders[index].themes = sortAlphaDesc(folders[index].themes)
        Folders.updateFolderState(folders, context, dataProvider)
    }
    const sortAlphaDesc = (themes: IThemeEXT[]) => {
        return themes.sort((a, b) => ThemeExtUtil.getInterfaceIdentifier(a) > ThemeExtUtil.getInterfaceIdentifier(b) ? 1 : -1)
    }
    const sortAlphaAsc = (themes: IThemeEXT[]) => {
        return themes.sort((a, b) => ThemeExtUtil.getInterfaceIdentifier(a) < ThemeExtUtil.getInterfaceIdentifier(b) ? 1 : -1)
    }
}
