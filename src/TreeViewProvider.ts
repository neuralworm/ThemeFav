import * as vscode from 'vscode'
import * as lib from './lib'
import { ThemeExtJSON, ThemeExtJSON2 } from './ThemeExtJSON'
import { Folder } from './models/Folder'

export class ThemeFavProvider implements vscode.TreeDataProvider<ThemeFav>, vscode.TreeDragAndDropController<ThemeFav>{
    dropMimeTypes = ['application/vnd.code.tree.testViewDragAndDrop'];
	dragMimeTypes = ['text/uri-list'];
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
    refresh(): void {
        this.favs = lib.getFavorites(this.context)
        this.history = lib.getHistory(this.context)
        this.all = lib.getInstalled()
        this.folders = lib.getFolderState(this.context)
        this._onDidChangeTreeData.fire()
    }
    
}


export class ThemeFav implements vscode.TreeItem{
    label: string
    constructor(
        public theme: ThemeExtJSON,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly themeExt: ThemeExtJSON|undefined,
        public isFolder: boolean
      ) {
        this.theme = theme
        this.label = ThemeExtJSON2.getInterfaceIdentifier(theme)
        this.collapsibleState = 0
      }
      
      
}