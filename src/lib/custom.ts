import { ThemeEXT } from "../models/ThemeExtJSON"
import * as vscode from 'vscode'
import { ThemeFavProvider } from "../treeviews/TreeViewFavorites"

// export const updateCustomState = (customThemes: ThemeExtJSON[], context: vscode.ExtensionContext, themeProvider: ThemeFavProvider) => {
//     context.globalState.update("themeFav_folders", JSON.stringify(folders)).then(()=>{
//         themeProvider.refresh()
//     })
// }
// export const getCustomState = (context: vscode.ExtensionContext): Folder[] => {
//     let folderString: string | undefined = context.globalState.get("themeFav_folders")
//     // PARSE ATTEMPT
//     try {
//         JSON.parse(folderString!)
//     }
//     catch (e) {
//         folderString = "[]"
//     }
//     if(!folderString) folderString = "[]"
//     const folderArr: Folder[] = JSON.parse(folderString)
//     return folderArr
// }