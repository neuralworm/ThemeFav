import * as vscode from 'vscode'
import * as lib from './lib'

export class ThemeFavProvider implements vscode.TreeDataProvider<ThemeFav>{
    context: vscode.ExtensionContext
    favs: string[]
    private _onDidChangeTreeData: vscode.EventEmitter<ThemeFav|undefined|null|void> = new vscode.EventEmitter<ThemeFav|undefined|null|void>()
    readonly onDidChangeTreeData: vscode.Event<ThemeFav | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext){
        this.context = context
        this.favs = lib.getFavorites(this.context)
    }
    getTreeItem(element: ThemeFav): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: ThemeFav | undefined): vscode.ProviderResult<ThemeFav[]> {
        return this.favs.map((themeString: string, index: number)=>{
            return new ThemeFav(themeString, vscode.TreeItemCollapsibleState.None)
        })
    }
    refresh(): void {
        this.favs = lib.getFavorites(this.context)
        this._onDidChangeTreeData.fire()
    }
    
}


export class ThemeFav implements vscode.TreeItem{
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
      ) {
        this.label = label
      }
      
}