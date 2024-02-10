import { MashupThemeItem } from './TreeViewMashups';
import * as vscode from 'vscode'
import { IThemeEXT, ThemeExtUtil } from '../models/IThemeExtJSON';
import * as lib from '../lib'
import path = require('path');
import { InstalledThemeItem } from './TreeViewInstalled';
import { ThemeItem } from './TreeViewFavorites';


export class ActiveDataProvider implements vscode.TreeDataProvider<ActiveThemeItem|MashupActiveItem>, vscode.TreeDragAndDropController<ActiveThemeItem>{
    dropMimeTypes = ["application/vnd.code.tree.favtreeview"];
	dragMimeTypes = ['application/vnd.code.tree.activetreeview'];
    context: vscode.ExtensionContext
    activeTheme: IThemeEXT
    mashupActive: boolean = false
    private _onDidChangeTreeData: vscode.EventEmitter<ActiveThemeItem|undefined|null|void> = new vscode.EventEmitter<ActiveThemeItem|undefined|null|void>()
    readonly onDidChangeTreeData: vscode.Event<ActiveThemeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext){
        this.context = context
        this.activeTheme = lib.getCurrentTheme()
    }
    getTreeItem(element: ActiveThemeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: ActiveThemeItem | undefined): vscode.ProviderResult<(ActiveThemeItem|MashupActiveItem)[]> {
        console.log("GETTING NEW CHILDREN: " + this.mashupActive)
        // RETURN FAVORITES AS ROOT ELEMENTS
        return this.mashupActive ? [new MashupActiveItem()] : [new ActiveThemeItem(this.activeTheme, vscode.TreeItemCollapsibleState.None)]
    }
    // SYNC WITH STATE
    refresh(): void {
        this.activeTheme = lib.getCurrentTheme()
        this._onDidChangeTreeData.fire()
    }
    // DROP
    handleDrag(source: readonly ActiveThemeItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
        dataTransfer.set("application/vnd.code.tree.favtreeview", new vscode.DataTransferItem(source))
    }
    handleDrop(target: ActiveThemeItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
        const data: vscode.DataTransferItem|undefined = dataTransfer.get("application/vnd.code.tree.favtreeview")
        if(!data) return
        const theme: string|ThemeItem[] = data.value
        let incoming: ThemeItem[]
        try {
            incoming = JSON.parse(theme as string) 
        }
        catch (e) {
            incoming = theme as ThemeItem[]
        }
        lib.activateTheme(incoming[0].theme, this)
    }
}

export class ActiveThemeItem implements vscode.TreeItem{
    public label: string
    public contextValue?: string = "activeThemeItem"
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
        this.label = ThemeExtUtil.getInterfaceIdentifier(theme)
        this.collapsibleState = vscode.TreeItemCollapsibleState.None
        this.contextValue = "activeThemeItem"
        this.description = theme.uiTheme
        this.tooltip = theme.absPath
      }
}
export class MashupActiveItem implements vscode.TreeItem{
    public label: string = "Mashup Theme"
    public contextValue?: string = "mashupThemeActive"
    public description?: string | boolean | undefined;
    public tooltip?: string | vscode.MarkdownString | undefined;
    constructor(
        public readonly iconPath = {
            light: path.join(__filename, '../', "../", "../", 'resources', "fire.svg"),
            dark: path.join(__filename, '../', "../", "../", 'resources', "fire.svg")
        }
      ) {
        this.tooltip = "Mashup Theme Active"
      }
}