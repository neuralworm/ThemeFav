import * as vscode from 'vscode'
import { IThemeEXT, ThemeExtUtil } from '../models/IThemeExtJSON'
import { ThemeFavProvider } from '../treeviews/TreeViewFavorites'
import * as lib from '../lib'

export namespace Favorites{
    export const updateUncatFavs = (newFavs: IThemeEXT[], context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
        context.globalState.update("themeFav_favorites", JSON.stringify(newFavs)).then(() => {
            themeProvider.refresh()
        })
    }
    export const addThemeToUncat = (themeToAdd: IThemeEXT, context: vscode.ExtensionContext, themeProvider: ThemeFavProvider, index?: number) => {
        let favs: IThemeEXT[] = getFavorites(context)
        let doesExist: boolean = lib.doesInclude(favs, themeToAdd)
        if (doesExist) return
        if (index !== undefined) {
            favs.splice(index, 0, themeToAdd)
        }
        else favs.push(themeToAdd)
        updateUncatFavs(favs, context, themeProvider)
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
export const saveThemeToUncat = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    const activeTheme: IThemeEXT = lib.getCurrentTheme()
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
    const ind = lib.getThemeNameArray(favorites).indexOf(themeString)
    if (ind == -1) return
    favorites.splice(ind, 1)
    context.globalState.update("themeFav_favorites", JSON.stringify(favorites)).then(() => {
        themeProvider.refresh()
    })
}
}