import * as vscode from 'vscode'
import * as lib from './lib'
import { ThemeExtJSON } from './ThemeExtJSON'

export class ThemeFavProvider implements vscode.TreeDataProvider<ThemeFav>{
    context: vscode.ExtensionContext
    favs: string[]
    all: ThemeExtJSON[]
    private _onDidChangeTreeData: vscode.EventEmitter<ThemeFav|undefined|null|void> = new vscode.EventEmitter<ThemeFav|undefined|null|void>()
    readonly onDidChangeTreeData: vscode.Event<ThemeFav | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext){
        this.context = context
        this.favs = lib.getFavorites(this.context)
        this.all = lib.getAllInstalled()
    }
    getTreeItem(element: ThemeFav): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: ThemeFav | undefined): vscode.ProviderResult<ThemeFav[]> {
        // RETURN CHILDREN OF INSTALLED
        // if(element?.label == "Installed") return this.all.map((val: ThemeExtJSON)=>{
        //     return new ThemeFav(val.id ? val.id : val.label, vscode.TreeItemCollapsibleState.None)
        // }) 
        // RETURN FAVORITES AS ROOT ELEMENTS
        return [...this.favs.map((themeString: string, index: number)=>{
            return new ThemeFav(themeString, vscode.TreeItemCollapsibleState.None)
        }), new ThemeFav("Installed", vscode.TreeItemCollapsibleState.Collapsed)]
    }
    refresh(): void {
        this.favs = lib.getFavorites(this.context)
        this.all = lib.getAllInstalled()
        this._onDidChangeTreeData.fire()
    }
    
}


export class ThemeFav implements vscode.TreeItem{
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
      ) {
        this.label = label
        this.collapsibleState = 0
      }
      
}