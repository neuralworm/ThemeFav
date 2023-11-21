import * as vscode from 'vscode'
import { ThemeFav, ThemeFavProvider } from './TreeViewProvider'
import { ThemeExtJSON, createThemeExtJSON } from './ThemeExtJSON'

// BASIC STATE MANAGEMENT
export const updateThemeState = (newFavs: string[], context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    context.globalState.update("theme_favorites", JSON.stringify(newFavs)).then(()=>{
        themeProvider.refresh()
    })
}
export const getFavorites = (context: vscode.ExtensionContext): string[] => {
    let state = context.globalState
    let favoriteString: string | undefined = state.get('theme_favorites')
    // ATTEMPT TO PARSE
    try {
        JSON.parse(favoriteString!)
    }
    catch (e) {
        favoriteString = "[]"
    }
    if (!favoriteString) favoriteString = "[]"
    let favoriteArray: string[] = JSON.parse(favoriteString)
    return favoriteArray
}
export const saveThemeToState = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let themeString = getCurrentTheme()
    let favoriteArray = getFavorites(context)
    if (favoriteArray.indexOf(themeString) == -1) {
        favoriteArray.push(themeString)
    }
    else return
    let toSave = JSON.stringify(favoriteArray)
    context.globalState.update("theme_favorites", toSave).then(() => {
        themeProvider.refresh()
        vscode.window.showInformationMessage(themeString + " saved to favorites.")
    })
}
export const removeThemeFromState = (context: vscode.ExtensionContext, themeString: string, themeProvider: ThemeFavProvider) => {
    console.log('request to remove ' + themeString)
    let favorites: string[] = getFavorites(context)
    let ind = favorites.indexOf(themeString)
    if (ind == -1) return
    favorites.splice(ind, 1)
    context.globalState.update("theme_favorites", JSON.stringify(favorites)).then(() => {
        themeProvider.refresh()
        vscode.window.showInformationMessage(themeString + " removed from favorites.")
    })
}
export const activateTheme = (themeString: string) => {
    vscode.commands.executeCommand("workbench.action.selectTheme").then((val: any) => {
        vscode.commands.executeCommand(themeString).then(() => {

        })
    })
}
// MENU ACTION
export const selectFavorite = (context: vscode.ExtensionContext) => {
    let favs = getFavorites(context)
    let current = getCurrentTheme()
    let currentIncludedInFavorites = doesContain(favs, current)
    // CREATE OPTIONS
    let quickPickItems: vscode.QuickPickItem[] = []
    favs.forEach((val: string) => {
        let quickPick: vscode.QuickPickItem = {
            label: val,
        }
        quickPickItems.push(quickPick)
    })
    // SETUP
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = quickPickItems
    quickPickAction.title = "Select theme."
    // SET ACTIVE IF POSSIBLE
    if (currentIncludedInFavorites) {
        let indexOfCurrent = quickPickItems.map((qp) => {
            return qp.label
        }).indexOf(current)
        quickPickAction.activeItems = [quickPickItems[indexOfCurrent]]
    }
    // CALLBACKS
    quickPickAction.onDidAccept(() => {
        const selection = quickPickAction.activeItems[0]
        setThemeActive(selection.label)
        quickPickAction.hide()
    })
    quickPickAction.onDidChangeActive(() => {
        const selection = quickPickAction.activeItems[0]
        setThemeActive(selection.label)
    })
    // ACTIVATE
    quickPickAction.show()
}
export const removeViaCommandPalette = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let favs = getFavorites(context)
    let quickPicks: vscode.QuickPickItem[] = []
    favs.forEach((val: string) => {
        let quickPick: vscode.QuickPickItem = {
            label: val,
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
    let allThemes = getAllInstalled()
    let favs = getFavorites(context)
    let quickPickItems: vscode.QuickPickItem[] = allThemes.map((val: ThemeExtJSON)=>{
        let pick: vscode.QuickPickItem = {
            label: val.id ? val.id : val.label,
        }
        return pick
    })
    // CREATE SELECTED LIST 
    let selected = quickPickItems.filter((val: vscode.QuickPickItem) => {
        if(favs.includes(val.label)) return true
        return false
    })
    // SETUP MENU
    let quickPickAction = vscode.window.createQuickPick()
    quickPickAction.items = quickPickItems
    quickPickAction.title = "Manage Themes"
    quickPickAction.canSelectMany = true
    quickPickAction.selectedItems = selected
    // NEW FAVS LIST TO SET TO STATE IF ACCEPTED
    let newFavs: string[] = []
    //  ACTIONS
    quickPickAction.onDidChangeSelection((e: readonly vscode.QuickPickItem[]) => {
        newFavs = e.map((pick: vscode.QuickPickItem)=> pick.label)
    })
    quickPickAction.onDidAccept(() => {
        updateThemeState(newFavs, context, themeProvider)
        quickPickAction.hide()
    })
     // ACTIVATE
     quickPickAction.show()
}
export const removeViaView = (themeFav: ThemeFav, context: vscode.ExtensionContext, treeProvider: ThemeFavProvider) => {
    let toRemove: string = themeFav.label
    removeThemeFromState(context, toRemove, treeProvider)
}
export const sortListAlphaAsc = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let favs = getFavorites(context)
    let sorted = sortAlphaAsc(favs)
    context.globalState.update("theme_favorites", JSON.stringify(sorted)).then(() => {
        themeProvider.refresh()
    })
}
export const sortListAlphaDesc = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let favs = getFavorites(context)
    let sorted = sortAlphaDesc(favs)
    context.globalState.update("theme_favorites", JSON.stringify(sorted)).then(() => {
        themeProvider.refresh()
    })
}

// UTIL
export const setThemeActive = (themeString: string) => {
    let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
    config.update("workbench.colorTheme", themeString)
}
export const getCurrentTheme = (): string => {
    let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
    console.log(config.get("workbench.theme"))
    let theme: string = config.get("workbench.colorTheme")!
    return theme
}
export const doesContain = (favs: string[], themeString: string): boolean => {
    if (favs.indexOf(themeString) === -1) return false
    return true
}
export const getThemeIndex = (themes: string[], theme: string) => {
    return themes.indexOf(theme)
}

// ORGANIZATION
export const reorderTheme = (context: vscode.ExtensionContext, themeToMove: string, newInd: number) => {
    let themes = getFavorites(context)
    let ind = getThemeIndex(themes, themeToMove)
    let newArray = [...themes]
    let moving: string[] = newArray.splice(ind, 1)
    newArray.splice(newInd, 0, moving[0])
    context.globalState.update('theme_favorites', newArray).then(() => {
        vscode.commands.executeCommand("themeFav.refreshTreeView")
    })
}
// SORT UTIL
const sortAlphaDesc = (themes: string[]) => {
    return themes.sort((a, b) => a > b ? 1 : -1)
}
const sortAlphaAsc = (themes: string[]) => {
    return themes.sort((a, b) => a < b ? 1 : -1)
}
// BASE THEMES
export const getAllInstalled = (): ThemeExtJSON[] => {
    let ext: vscode.Extension<any>[] = [...vscode.extensions.all]
    let themesArr: any[] = ext.filter((val: vscode.Extension<any>) => {
        if (val.packageJSON.hasOwnProperty("contributes")) return true
        return false
    }).map((val: vscode.Extension<any>) => {
        return val.packageJSON.contributes
    })
    themesArr = themesArr.filter((val: any) => {
        if (val.hasOwnProperty("themes")) return true
        return false
    }).flatMap((val: any) => {
        return val.themes
    }).map((val: any) => {
        return createThemeExtJSON(val.label, val.path, val.uiTheme, val.id ? val.id : null)
    })
    console.log(themesArr)
    return themesArr
}
export const validateThemes = (context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
    let installed: ThemeExtJSON[] = getAllInstalled()
    let installStrings = installed.map((val: ThemeExtJSON)=> val.id ? val.id : val.label)
    let favs = getFavorites(context)
    let newFavs = favs.filter((themeString: string) => {
        if(installStrings.includes(themeString)) return true
        return false
    })
    updateThemeState(newFavs, context, themeProvider)
}
const checkIfIfInstalled = (themeString: string, allInstalled: ThemeExtJSON[]): boolean => {
    if(allInstalled.map((val: ThemeExtJSON)=> val.id ? val.id : val.label).includes(themeString)) return true
    return false
}