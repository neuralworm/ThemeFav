import * as vscode from 'vscode'
import * as lib from '../lib'
import { ThemeExtJSON, ThemeExtJSON2 } from '../models/ThemeExtJSON'
import { Folder } from '../models/Folder'
import path = require('path');

export class ThemeFavProvider implements vscode.TreeDataProvider<ThemeItem|FolderItem>, vscode.TreeDragAndDropController<ThemeItem>{
    dropMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
	dragMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
    context: vscode.ExtensionContext
    favs: ThemeExtJSON[]
    installed: ThemeExtJSON[]
    history: ThemeExtJSON[]
    folders: Folder[]
    private _onDidChangeTreeData: vscode.EventEmitter<ThemeItem|undefined|null|void> = new vscode.EventEmitter<ThemeItem|undefined|null|void>()
    readonly onDidChangeTreeData: vscode.Event<ThemeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext){
        this.context = context
        this.favs = lib.getFavorites(this.context)
        this.installed = lib.getInstalled()
        this.history = lib.getHistory(this.context)
        this.folders = lib.getFolderState(this.context)
    }
    getTreeItem(element: ThemeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: ThemeItem | FolderItem | undefined): vscode.ProviderResult<(ThemeItem|FolderItem)[]> {
        // RETURN FAVORITES AS ROOT ELEMENTS
        if(element === undefined) return [...this.favs.map((themeExtJson: ThemeExtJSON, index: number)=>{
            return new ThemeItem(themeExtJson, vscode.TreeItemCollapsibleState.None)
        }), ...this.folders.map((folder: Folder) => new FolderItem(vscode.TreeItemCollapsibleState.Expanded, folder))]
        else if (element.hasOwnProperty("folder")){
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
      dataTransfer.set('text/plain', new vscode.DataTransferItem(source))
      console.log('drag?')
    }
    handleDrop(target: ThemeItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
        const transferContent = dataTransfer.get('application/vnd.code.tree.favtreeview')
        console.log(transferContent)
    }
   
}


export class ThemeItem implements vscode.TreeItem{
    label: string
    public contextValue?: string
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
        if(parent && parent.label == "Installed") this.contextValue = "installed"
        else this.contextValue = "themeItem"
      }
      
      
      
}
export class FolderItem implements vscode.TreeItem{
    label: string
    contextValue?: string | undefined;
    public readonly iconPath = {
        light: path.join(__filename, '../', "../", "../", 'resources', `folder${this.folder.open ? "_open" : ""}.png`),
        dark: path.join(__filename, '../', "../", "../", 'resources', `folder${this.folder.open ? "_open" : ""}.png`)
    }
    constructor(
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public folder: Folder,
      ) {
        this.folder = folder
        this.label = folder.label + `${this.folder.themes.length > 0 ? ` (${folder.themes.length})` : " (empty)"}`
        
        this.collapsibleState = folder.open ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed
        this.contextValue = "folder"
      }
    
}