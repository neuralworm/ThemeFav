import * as vscode from 'vscode'
import * as lib from './lib'
import { ThemeExtJSON, ThemeExtJSON2 } from './ThemeExtJSON'

export class ThemeFavProvider implements vscode.TreeDataProvider<ThemeFav>{
    context: vscode.ExtensionContext
    favs: ThemeExtJSON[]
    all: ThemeExtJSON[]
    history: string[]
    private _onDidChangeTreeData: vscode.EventEmitter<ThemeFav|undefined|null|void> = new vscode.EventEmitter<ThemeFav|undefined|null|void>()
    readonly onDidChangeTreeData: vscode.Event<ThemeFav | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext){
        this.context = context
        this.favs = lib.getFavorites(this.context)
        this.all = lib.getInstalled()
        this.history = lib.getHistory(this.context)
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
        return [...this.favs.map((themeExtJson: ThemeExtJSON, index: number)=>{
            return new ThemeFav(themeExtJson, vscode.TreeItemCollapsibleState.None, undefined)
        })]
    }
    refresh(): void {
        this.favs = lib.getFavorites(this.context)
        this.history = lib.getHistory(this.context)
        this.all = lib.getInstalled()
        this._onDidChangeTreeData.fire()
    }
    
}


export class ThemeFav implements vscode.TreeItem{
    label: string
    constructor(
        public theme: ThemeExtJSON,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly themeExt: ThemeExtJSON|undefined
      ) {
        this.theme = theme
        this.label = ThemeExtJSON2.getInterfaceIdentifier(theme)
        this.collapsibleState = 0
      }
      
      
}