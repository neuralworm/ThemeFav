import { IThemeEXT } from '../models/IThemeExtJSON';
import * as vscode from 'vscode'
import * as lib from '../lib'
import path = require('path');
import { History } from '../lib/history';


export class HistoryDataProvider implements vscode.TreeDataProvider<HistoryItem>, vscode.TreeDragAndDropController<HistoryItem>{
    dropMimeTypes = [];
	dragMimeTypes = ['application/vnd.code.tree.historytreeview'];
    context: vscode.ExtensionContext
    history: IThemeEXT[]
    private _onDidChangeTreeData: vscode.EventEmitter<HistoryItem|undefined|null|void> = new vscode.EventEmitter<HistoryItem|undefined|null|void>()
    readonly onDidChangeTreeData: vscode.Event<HistoryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext){
        this.context = context
        this.history = History.getHistory(context)
    }
    getTreeItem(element: HistoryItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: HistoryItem | undefined): vscode.ProviderResult<(HistoryItem)[]> {
        // RETURN FAVORITES AS ROOT ELEMENTS
        if(element === undefined) return this.history.map((historyItem: IThemeEXT)=>{
            return new HistoryItem(historyItem, vscode.TreeItemCollapsibleState.None)
        })
    }
    // SYNC WITH STATE
    refresh(): void {
        this.history = History.getHistory(this.context)
        this._onDidChangeTreeData.fire()
    }
    handleDrag(source: readonly HistoryItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
        dataTransfer.set('application/vnd.code.tree.historytreeview', new vscode.DataTransferItem(source))
    }
   
}

export class HistoryItem implements vscode.TreeItem{
    public contextValue?: string = "historyItem"
    public label: string
    constructor(
        public theme: IThemeEXT,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly iconPath = {
            light: path.join(__filename, '../', "../", "../", 'resources', 'json.svg'),
            dark: path.join(__filename, '../', "../", "../", 'resources', 'json.svg')
        }
      ) {
        this.label = theme.label
        this.collapsibleState = vscode.TreeItemCollapsibleState.None
        this.contextValue = "historyItem"
      }
      
}