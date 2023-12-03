import { IThemeEXT } from "./IThemeExtJSON"
import * as vscode from 'vscode'
import { IFolder } from "./IFolder"
export class ThemeQuickPickItem implements vscode.QuickPickItem{
    label: string
    theme: IThemeEXT
    constructor(label: string, theme: IThemeEXT){
        this.label = label
        this.theme = theme
    }
}
export class FolderQuickPickItem implements vscode.QuickPickItem{
    label: string
    folder: IFolder
    index: number
    constructor(label: string, folder: IFolder, index: number){
        this.label = label
        this.folder = folder,
        this.index = index
    }
}