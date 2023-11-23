import * as vscode from 'vscode'
import * as lib from './lib'
import { ThemeExtJSON, ThemeExtJSON2 } from './ThemeExtJSON'
import { Folder } from './models/Folder'

export class ThemeFavProvider implements vscode.TreeDataProvider<ThemeFav>, vscode.TreeDragAndDropController<ThemeFav>{
    dropMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
	dragMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
    context: vscode.ExtensionContext
    favs: ThemeExtJSON[]
    all: ThemeExtJSON[]
    history: ThemeExtJSON[]
    folders: Folder[]
    private _onDidChangeTreeData: vscode.EventEmitter<ThemeFav|undefined|null|void> = new vscode.EventEmitter<ThemeFav|undefined|null|void>()
    readonly onDidChangeTreeData: vscode.Event<ThemeFav | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext){
        this.context = context
        this.favs = lib.getFavorites(this.context)
        this.all = lib.getInstalled()
        this.history = lib.getHistory(this.context)
        this.folders = lib.getFolderState(this.context)
    }
    getTreeItem(element: ThemeFav): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: ThemeFav | undefined): vscode.ProviderResult<ThemeFav[]> {
        // RETURN FAVORITES AS ROOT ELEMENTS
        return [...this.favs.map((themeExtJson: ThemeExtJSON, index: number)=>{
            return new ThemeFav(themeExtJson, vscode.TreeItemCollapsibleState.None, undefined, false)
        })]
    }
    // SYNC WITH STATE
    refresh(): void {
        this.favs = lib.getFavorites(this.context)
        this.history = lib.getHistory(this.context)
        this.all = lib.getInstalled()
        this.folders = lib.getFolderState(this.context)
        this._onDidChangeTreeData.fire()
    }
    // DRAG N DROP
    handleDrag(source: readonly ThemeFav[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
      dataTransfer.set('application/vnd.code.tree.favtreeview', new vscode.DataTransferItem(source))
      console.log('drag?')
    }
    handleDrop(target: ThemeFav | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
        const transferContent = dataTransfer.get('application/vnd.code.tree.favtreeview')
        console.log(transferContent)
    }
   
}


export class ThemeFav implements vscode.TreeItem{
    label: string
    constructor(
        public theme: ThemeExtJSON,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly themeExt: ThemeExtJSON|undefined,
        public isFolder: boolean,
        public children?: ThemeFav[]
      ) {
        this.theme = theme
        this.label = ThemeExtJSON2.getInterfaceIdentifier(theme)
        this.collapsibleState = vscode.TreeItemCollapsibleState.None
      }
      
      
}