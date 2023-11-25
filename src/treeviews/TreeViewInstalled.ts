import * as vscode from 'vscode'
import { ThemeExtJSON, ThemeExtJSON2 } from '../models/ThemeExtJSON';
import * as lib from '../lib'
import path = require('path');

export class InstalledThemeProvider implements vscode.TreeDataProvider<InstalledThemeItem>, vscode.TreeDragAndDropController<InstalledThemeItem>{
    dropMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
	dragMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
    context: vscode.ExtensionContext
    installed: ThemeExtJSON[]
    private _onDidChangeTreeData: vscode.EventEmitter<InstalledThemeItem|undefined|null|void> = new vscode.EventEmitter<InstalledThemeItem|undefined|null|void>()
    readonly onDidChangeTreeData: vscode.Event<InstalledThemeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext){
        this.context = context
        this.installed = lib.getInstalled()
    }
    getTreeItem(element: InstalledThemeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: InstalledThemeItem | undefined): vscode.ProviderResult<(InstalledThemeItem)[]> {
        // RETURN FAVORITES AS ROOT ELEMENTS
        if(element === undefined) return this.installed.map((theme: ThemeExtJSON)=>{
            return new InstalledThemeItem(theme, vscode.TreeItemCollapsibleState.None)
        })
        
    }
    // SYNC WITH STATE
    refresh(): void {
        this.installed = lib.getInstalled()
        this._onDidChangeTreeData.fire()
    }
   
   
}


export class InstalledThemeItem implements vscode.TreeItem{
    public label: string
    public contextValue?: string = "installedThemeItem"
    public description?: string | boolean | undefined;
    constructor(
        public theme: ThemeExtJSON,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly iconPath = {
            light: path.join(__filename, '../', "../", "../", 'resources', 'json.svg'),
            dark: path.join(__filename, '../', "../", "../", 'resources', 'json.svg')
        }
      ) {
        this.theme = theme
        this.label = ThemeExtJSON2.getInterfaceIdentifier(theme)
        this.collapsibleState = vscode.TreeItemCollapsibleState.None
        this.contextValue = "installedThemeItem"
        this.description = theme.uiTheme
      }
      
      
      
}