import * as vscode from 'vscode'
import * as lib from '../lib'
import { IThemeEXT, ThemeExtUtil } from '../models/IThemeExtJSON'
import { IFolder } from '../models/IFolder'
import path = require('path');
import { InstalledThemeItem } from './TreeViewInstalled';
import { ActiveThemeItem } from './TreeViewActive';
import { Folders } from '../lib/folders';
import { Favorites } from '../lib/favorites';

export class ThemeFavProvider implements vscode.TreeDataProvider<ThemeItem | FolderItem>, vscode.TreeDragAndDropController<ThemeItem>{
    dropMimeTypes = ["application/vnd.code.tree.favtreeview", "application/vnd.code.tree.activetreeview", "text/plain"];
    dragMimeTypes = [];
    context: vscode.ExtensionContext
    favs: IThemeEXT[]
    installed: IThemeEXT[]
    history: IThemeEXT[]
    folders: IFolder[]
    private _onDidChangeTreeData: vscode.EventEmitter<ThemeItem | undefined | null | void> = new vscode.EventEmitter<ThemeItem | undefined | null | void>()
    readonly onDidChangeTreeData: vscode.Event<ThemeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext) {
        this.context = context
        const state: lib.IGlobalState = lib.getGlobalState(context)
        this.favs = state.uncategorized
        this.installed = state.installed
        this.history = state.history
        this.folders = state.folders
    }
    getTreeItem(element: ThemeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
   
    getChildren(element?: ThemeItem | FolderItem | undefined): vscode.ProviderResult<(ThemeItem | FolderItem)[]> {
        // RETURN FAVORITES AS ROOT ELEMENTS
        if (element === undefined) return [...this.favs.map((themeExtJson: IThemeEXT, index: number) => {
            return new ThemeItem(themeExtJson, vscode.TreeItemCollapsibleState.None)
        }), ...this.folders.map((folder: IFolder) => new FolderItem(vscode.TreeItemCollapsibleState.Expanded, folder))]
        else if (element.hasOwnProperty("folder")) {
            let folderElement = element as FolderItem
            return folderElement.folder.items.map((theme: IThemeEXT) => new ThemeItem(theme, vscode.TreeItemCollapsibleState.None, folderElement.folder))
        }
    }
    // SYNC WITH STATE
    refresh(): void {
        const state: lib.IGlobalState = lib.getGlobalState(this.context)
        this.favs = state.uncategorized
        this.installed = state.installed
        this.history = state.history
        this.folders = state.folders
        this._onDidChangeTreeData.fire()
    }
    // DRAG N DROP
    handleDrag(source: readonly ThemeItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
        dataTransfer.set('application/vnd.code.tree.favtreeview', new vscode.DataTransferItem(source))
        console.log('drag?')
    }
    handleDrop(target: ThemeItem | FolderItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
        const transferContent = dataTransfer.get('application/vnd.code.tree.favtreeview')
        if (transferContent) {
            console.log(transferContent)
            let targetType: TargetType
            let incoming: any[]
            try {
                incoming = JSON.parse(transferContent.value)
            }
            catch (e) {
                incoming = transferContent.value
            }
            // console.log("target: " + target)
            // console.log("data: " + incoming[0])

            targetType = !target ? "uncategorized" : (target.contextValue === "folder") ? "folder" : "item"
            
            // DETERMINE TRANSFER LOCATION
            let themeItem: InstalledThemeItem|ThemeItem|ActiveThemeItem = incoming[0]
            

            const activeTheme = themeItem.theme
            // HANDLE ADDS
            switch (targetType) {
                case "uncategorized":
                    if (lib.doesInclude(this.favs, activeTheme)) return
                    console.log(activeTheme)
                    Favorites.addThemeToUncat(activeTheme, this.context, this)
                    break;
                case "folder":
                    let targetFolder: FolderItem = target as FolderItem
                    if (lib.doesFolderInclude(targetFolder.folder, activeTheme)) return
                    Folders.addToFolder(activeTheme, targetFolder.folder, this.context, this)
                    break
                case "item":
                    const targetItem: ThemeItem = target as ThemeItem
                    if(targetItem.parent == undefined){
                        if(lib.doesInclude(this.favs, activeTheme)) return
                    } 
                    else{
                        if(lib.doesFolderInclude(targetItem.parent!, activeTheme)) return
                    } 
                    // GET PARENT OF TARGET ITEM
                    const parent: IFolder = targetItem.parent!

                    // MOVE TO UNCAT
                    if (!parent) {
                        const index = lib.getThemeIndex(this.favs, targetItem.label)
                        Favorites.addThemeToUncat(activeTheme, this.context, this, index)
                    }
                    // OR MOVE TO FOLDER
                    else {
                        const index = lib.getThemeIndex(parent.items, targetItem.label)
                        Folders.addToFolder(activeTheme, parent, this.context, this, index)
                    }
                    break
                default:
                    break
            }
            // HANDLE REMOVALS IF NECESSARY
            if (themeItem.contextValue === "installedThemeItem") console.log('no need to remove from a list')
            else {
                const themeItem2 = themeItem as ThemeItem
                const parent = themeItem2.parent
                if(parent === undefined) Favorites.removeThemeFromUncat(this.context, themeItem2.label, this)
                else Folders.removeFromFolder(themeItem2.theme, themeItem2.parent!, this.context, this)
            }
        }
    }
}

type TargetType = "uncategorized" | "folder" | "item"

export class ThemeItem implements vscode.TreeItem {
    public label: string
    public contextValue?: string
    public description?: string | boolean | undefined;
    tooltip?: string | vscode.MarkdownString | undefined;
    constructor(
        public theme: IThemeEXT,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public parent?: IFolder,
        public readonly iconPath = {
            light: path.join(__filename, '../', "../", "../", 'resources', theme.uiTheme == "vs" ? "light_dark.svg" : "dark_dark.svg"),
            dark: path.join(__filename, '../', "../", "../", 'resources', theme.uiTheme == "vs" ? "light_light.svg" : "dark_light.svg")
        }
    ) {
        this.theme = theme
        this.label = ThemeExtUtil.GetInterfaceIdentifier(theme)
        this.collapsibleState = vscode.TreeItemCollapsibleState.None
        if (parent && parent.label == "Installed") this.contextValue = "installed"
        else this.contextValue = "themeItem"
        this.description = this.theme.uiTheme
        this.tooltip = theme.absPath + (this.parent ? " - " + this.parent.label : "")
    }
}
export class FolderItem implements vscode.TreeItem {
    label: string
    contextValue?: string | undefined;
    public readonly iconPath = {
        light: path.join(__filename, '../', "../", "../", 'resources', `folder${this.folder.open ? "_open" : ""}.png`),
        dark: path.join(__filename, '../', "../", "../", 'resources', `folder${this.folder.open ? "_open" : ""}.png`)
    }
    description?: string | boolean | undefined;
    constructor(
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public folder: IFolder,
    ) {
        this.folder = folder
        this.label = folder.label
        this.description = `${this.folder.items.length > 0 ? ` (${folder.items.length})` : " (empty)"}`

        this.collapsibleState = folder.open ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed
        this.contextValue = "folder"
    }
}