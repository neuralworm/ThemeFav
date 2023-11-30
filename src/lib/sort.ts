import { getFavorites } from "../lib"
import { IThemeEXT, ThemeExtUtil } from "../models/ThemeExtJSON"
import { ThemeFavProvider } from "../treeviews/TreeViewFavorites"
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
    const sortAlphaDesc = (themes: IThemeEXT[]) => {
        return themes.sort((a, b) => ThemeExtUtil.getInterfaceIdentifier(a) > ThemeExtUtil.getInterfaceIdentifier(b) ? 1 : -1)
    }
    const sortAlphaAsc = (themes: IThemeEXT[]) => {
        return themes.sort((a, b) => ThemeExtUtil.getInterfaceIdentifier(a) < ThemeExtUtil.getInterfaceIdentifier(b) ? 1 : -1)
    }
}
