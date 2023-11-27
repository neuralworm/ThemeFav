import { ThemeEXT } from "./ThemeExtJSON"
import * as vscode from 'vscode'
import { Folder } from "./Folder"
export class ThemeQuickPickItem implements vscode.QuickPickItem{
    label: string
    theme: ThemeEXT
    constructor(label: string, theme: ThemeEXT){
        this.label = label
        this.theme = theme
    }
}
export class FolderQuickPickItem implements vscode.QuickPickItem{
    label: string
    folder: Folder
    index: number
    constructor(label: string, folder: Folder, index: number){
        this.label = label
        this.folder = folder,
        this.index = index
    }
}