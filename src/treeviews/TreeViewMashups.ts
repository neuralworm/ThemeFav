import * as vscode from 'vscode'
import { ThemeEXT, ThemeExtUtil } from '../models/ThemeExtJSON';
import * as lib from '../lib'
import path = require('path');

const sections: string[] = [
    "BASE",
    "SIDEBAR",
    "TERMINAL",
    "EDITOR"
]

export class MashupThemeProvider implements vscode.TreeDataProvider<MashupFolderItem|MashupThemeItem>, vscode.TreeDragAndDropController<MashupFolderItem|MashupThemeItem>{
    dropMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
	dragMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
    context: vscode.ExtensionContext
    private _onDidChangeTreeData: vscode.EventEmitter<MashupFolderItem|undefined|null|void> = new vscode.EventEmitter<MashupFolderItem|undefined|null|void>()
    readonly onDidChangeTreeData: vscode.Event<MashupFolderItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(context: vscode.ExtensionContext){
        this.context = context
    }
    getTreeItem(element: MashupFolderItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: MashupFolderItem | MashupThemeItem | undefined): vscode.ProviderResult<(MashupFolderItem|MashupThemeItem)[]> {
        // RETURN FAVORITES AS ROOT ELEMENTS
        if(element === undefined) return sections.map((section: string)=>{
            return new MashupFolderItem(section, vscode.TreeItemCollapsibleState.None)
        })
        if(element.contextValue === "mashup"){
            let el = element as MashupFolderItem
            if(el.child)  return [new MashupThemeItem(el.child)]
        }
        
    }
    // SYNC WITH STATE
    refresh(): void {
        this._onDidChangeTreeData.fire()
    }
   
}

export class MashupFolderItem implements vscode.TreeItem{
    public contextValue?: string = "mashup"
    public child?: ThemeEXT
    constructor(
        public label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly iconPath = {
            light: path.join(__filename, '../', "../", "../", 'resources', 'folder.png'),
            dark: path.join(__filename, '../', "../", "../", 'resources', 'folder.png')
        }
      ) {
        this.label = label
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded
        this.contextValue = "mashup"
      }
      
}

export class MashupThemeItem implements vscode.TreeItem{
    public theme: ThemeEXT
    public label: string
    public collapsibleState?: vscode.TreeItemCollapsibleState | undefined;
    public contextValue?: string | undefined = "mashup_theme"
    
    constructor(theme: ThemeEXT){
        this.label = theme.label
        this.theme = theme
        this.collapsibleState = vscode.TreeItemCollapsibleState.None
    }
}