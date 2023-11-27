import * as vscode from 'vscode'
import { ThemeEXT, ThemeExtUtil } from '../models/ThemeExtJSON';
import * as lib from '../lib'
import path = require('path');


export class MashupThemeProvider implements vscode.TreeDataProvider<HistoryItem>, vscode.TreeDragAndDropController<HistoryItem>{
    dropMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
	dragMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
    context: vscode.ExtensionContext
    history: ThemeEXT[]
    private _onDidChangeTreeData: vscode.EventEmitter<HistoryItem|undefined|null|void> = new vscode.EventEmitter<HistoryItem|undefined|null|void>()
    readonly onDidChangeTreeData: vscode.Event<HistoryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext){
        this.context = context
        this.history = lib.getHistory(context)
    }
    getTreeItem(element: HistoryItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: HistoryItem | undefined): vscode.ProviderResult<(HistoryItem)[]> {
        // RETURN FAVORITES AS ROOT ELEMENTS
        if(element === undefined) return this.history.map((historyItem: ThemeEXT)=>{
            return new HistoryItem(historyItem.label, vscode.TreeItemCollapsibleState.None)
        })
    }
    // SYNC WITH STATE
    refresh(): void {
        this.history = lib.getHistory(this.context)
        this._onDidChangeTreeData.fire()
    }
   
}

export class HistoryItem implements vscode.TreeItem{
    public contextValue?: string = "historyItem"
    constructor(
        public label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly iconPath = {
            light: path.join(__filename, '../', "../", "../", 'resources', 'json.svg'),
            dark: path.join(__filename, '../', "../", "../", 'resources', 'json.svg')
        }
      ) {
        this.label = label
        this.collapsibleState = vscode.TreeItemCollapsibleState.None
        this.contextValue = "historyItem"
      }
      
}