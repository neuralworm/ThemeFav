import * as vscode from 'vscode'
import { ThemeExtJSON, ThemeExtJSON2 } from '../models/ThemeExtJSON';
import * as lib from '../lib'
import path = require('path');

const sections: string[] = [
    "BASE",
    "SIDEBAR",
    "TERMINAL",
    "EDITOR"
]

export class MashupThemeProvider implements vscode.TreeDataProvider<MashupItem>, vscode.TreeDragAndDropController<MashupItem>{
    dropMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
	dragMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
    context: vscode.ExtensionContext
    private _onDidChangeTreeData: vscode.EventEmitter<MashupItem|undefined|null|void> = new vscode.EventEmitter<MashupItem|undefined|null|void>()
    readonly onDidChangeTreeData: vscode.Event<MashupItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext){
        this.context = context
    }
    getTreeItem(element: MashupItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: MashupItem | undefined): vscode.ProviderResult<(MashupItem)[]> {
        // RETURN FAVORITES AS ROOT ELEMENTS
        if(element === undefined) return sections.map((section: string)=>{
            return new MashupItem(section, vscode.TreeItemCollapsibleState.None)
        })
        
    }
    // SYNC WITH STATE
    refresh(): void {
        this._onDidChangeTreeData.fire()
    }
   
}

export class MashupItem implements vscode.TreeItem{
    public contextValue?: string = "mashup"
    constructor(
        public label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly iconPath = {
            light: path.join(__filename, '../', "../", "../", 'resources', 'folder.png'),
            dark: path.join(__filename, '../', "../", "../", 'resources', 'folder.png')
        }
      ) {
        this.label = label
        this.collapsibleState = vscode.TreeItemCollapsibleState.None
        this.contextValue = "mashup"
      }
      
}