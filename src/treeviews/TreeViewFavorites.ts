import * as vscode from 'vscode'
import * as lib from '../lib'
import { ThemeExtJSON, ThemeExtJSON2 } from '../models/ThemeExtJSON'
import { Folder } from '../models/Folder'
import path = require('path');
import { InstalledThemeItem } from './TreeViewInstalled';

export class ThemeFavProvider implements vscode.TreeDataProvider<ThemeItem | FolderItem>, vscode.TreeDragAndDropController<ThemeItem>{
    dropMimeTypes = ["application/vnd.code.tree.favtreeview", "text/plain"];
    dragMimeTypes = [];
    context: vscode.ExtensionContext
    favs: ThemeExtJSON[]
    installed: ThemeExtJSON[]
    history: ThemeExtJSON[]
    folders: Folder[]
    private _onDidChangeTreeData: vscode.EventEmitter<ThemeItem | undefined | null | void> = new vscode.EventEmitter<ThemeItem | undefined | null | void>()
    readonly onDidChangeTreeData: vscode.Event<ThemeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext) {
        this.context = context
        this.favs = lib.getFavorites(this.context)
        this.installed = lib.getInstalled()
        this.history = lib.getHistory(this.context)
        this.folders = lib.getFolderState(this.context)
    }
    getTreeItem(element: ThemeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: ThemeItem | FolderItem | undefined): vscode.ProviderResult<(ThemeItem | FolderItem)[]> {
        // RETURN FAVORITES AS ROOT ELEMENTS
        if (element === undefined) return [...this.favs.map((themeExtJson: ThemeExtJSON, index: number) => {
            return new ThemeItem(themeExtJson, vscode.TreeItemCollapsibleState.None)
        }), ...this.folders.map((folder: Folder) => new FolderItem(vscode.TreeItemCollapsibleState.Expanded, folder))]
        else if (element.hasOwnProperty("folder")) {
            let folderElement = element as FolderItem
            return folderElement.folder.themes.map((theme: ThemeExtJSON) => new ThemeItem(theme, vscode.TreeItemCollapsibleState.None, folderElement.folder))
        }
    }
    // SYNC WITH STATE
    refresh(): void {
        this.favs = lib.getFavorites(this.context)
        this.history = lib.getHistory(this.context)
        this.installed = lib.getInstalled()
        this.folders = lib.getFolderState(this.context)
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

            let targetType: TargetType
            let incoming: any[]
            try {
                incoming = JSON.parse(transferContent.value)
            }
            catch (e) {
                incoming = transferContent.value
            }
            console.log("target: " + target)
            console.log("data: " + incoming[0])

            targetType = !target ? "uncategorized" : (target.contextValue === "folder") ? "folder" : "item"
            
            const themeItem: InstalledThemeItem = incoming[0]
            const theme = themeItem.theme
            console.log(themeItem)
            // HANDLE ADDS
            switch (targetType) {
                case "uncategorized":
                    if (lib.doesInclude(this.favs, theme)) break
                    lib.addThemeToUncat(theme, this.context, this)
                    break;
                case "folder":
                    let targetFolder: FolderItem = target as FolderItem
                    if (lib.doesFolderInclude(targetFolder.folder, theme)) break
                    lib.addToFolder(theme, targetFolder.folder, this.context, this)
                    break
                case "item":
                    const targetItem: ThemeItem = target as ThemeItem
                    // GET PARENT OF TARGET ITEM
                    const parent: Folder = targetItem.parent!

                    // MOVE TO UNCAT
                    if (!parent) {
                        const index = lib.getFavIndex(this.favs, targetItem.label)
                        lib.addThemeToUncat(theme, this.context, this, index)
                    }
                    // OR MOVE TO FOLDER
                    else {
                        const index = lib.getFavIndex(parent.themes, targetItem.label)
                        lib.addToFolder(theme, parent, this.context, this, index)
                    }
                    break
                default:
                    break
            }
            // HANDLE REMOVALS IF NECESSARY
            if (incoming[0].contextValue === "installedThemeItem") console.log('no need to remove from a list')
            else {
                
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
        public theme: ThemeExtJSON,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public parent?: Folder,
        public readonly iconPath = {
            light: path.join(__filename, '../', "../", "../", 'resources', 'json.svg'),
            dark: path.join(__filename, '../', "../", "../", 'resources', 'json.svg')
        }
    ) {
        this.theme = theme
        this.label = ThemeExtJSON2.getInterfaceIdentifier(theme)
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
        public folder: Folder,
    ) {
        this.folder = folder
        this.label = folder.label
        this.description = `${this.folder.themes.length > 0 ? ` (${folder.themes.length})` : " (empty)"}`

        this.collapsibleState = folder.open ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed
        this.contextValue = "folder"
    }

}