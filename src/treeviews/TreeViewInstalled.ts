import * as vscode from 'vscode'
import { IThemeEXT, ThemeExtUtil } from '../models/IThemeExtJSON';
import * as lib from '../lib'
import path = require('path');

export class InstalledThemeProvider implements vscode.TreeDataProvider<InstalledThemeItem>, vscode.TreeDragAndDropController<InstalledThemeItem>{
    dropMimeTypes = [];
	dragMimeTypes = ["application/vnd.code.tree.favtreeview"];
    context: vscode.ExtensionContext
    installed: IThemeEXT[]
    private _onDidChangeTreeData: vscode.EventEmitter<InstalledThemeItem|undefined|null|void> = new vscode.EventEmitter<InstalledThemeItem|undefined|null|void>()
    readonly onDidChangeTreeData: vscode.Event<InstalledThemeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext){
        this.context = context
        this.installed = lib.GetInstalled()
    }
    getTreeItem(element: InstalledThemeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: InstalledThemeItem | undefined): vscode.ProviderResult<(InstalledThemeItem)[]> {
        // RETURN FAVORITES AS ROOT ELEMENTS
        if(element === undefined) return this.installed.map((theme: IThemeEXT)=>{
            return new InstalledThemeItem(theme, vscode.TreeItemCollapsibleState.None)
        })
    }
    // SYNC WITH STATE
    refresh(): void {
        this.installed = lib.GetInstalled()
        console.log("SYncing...")
        this._onDidChangeTreeData.fire()
    }
    // DRAG
    handleDrag(source: readonly InstalledThemeItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
        console.log("drag")
        dataTransfer.set('application/vnd.code.tree.favtreeview', new vscode.DataTransferItem(source));
    }
}

export class InstalledThemeItem implements vscode.TreeItem{
    public label: string
    public contextValue?: string = "installedThemeItem"
    public description?: string | boolean | undefined;
    public tooltip?: string | vscode.MarkdownString | undefined;
    constructor(
        public theme: IThemeEXT,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly iconPath = {
            light: path.join(__filename, '../', "../", "../", 'resources', theme.uiTheme == "vs" ? "light_dark.svg" : "dark_dark.svg"),
            dark: path.join(__filename, '../', "../", "../", 'resources', theme.uiTheme == "vs" ? "light_light.svg" : "dark_light.svg")
        }
      ) {
        this.theme = theme
        this.label = ThemeExtUtil.GetInterfaceIdentifier(theme)
        this.collapsibleState = vscode.TreeItemCollapsibleState.None
        this.contextValue = "installedThemeItem"
        this.description = theme.uiTheme
        this.tooltip = theme.absPath
      }
}