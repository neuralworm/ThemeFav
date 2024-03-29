import * as vscode from 'vscode'
import { IThemeEXT, ThemeExtUtil } from '../models/IThemeExtJSON';
import * as lib from '../lib'
import path = require('path');
import { IMashupTheme, MashupSlot, MashupTheme, createMashupTheme } from '../models/IMashupTheme';
import { Custom } from '../lib/custom';
import { ThemeItem } from './TreeViewFavorites';
import { sections } from '../constants/mashupsections';
import { ActiveDataProvider } from './TreeViewActive';

const mashupTemp: IMashupTheme = createMashupTheme()
type Dictionary = {
    [index: string]: MashupSlot
}

export class MashupThemeProvider implements vscode.TreeDataProvider<MashupFolderItem | MashupThemeItem>, vscode.TreeDragAndDropController<MashupFolderItem | MashupThemeItem>{
    dropMimeTypes = ['application/vnd.code.tree.favtreeview', 'application/vnd.code.tree.historytreeview'];
    dragMimeTypes = ['application/vnd.code.tree.favtreeview'];
    context: vscode.ExtensionContext
    private _onDidChangeTreeData: vscode.EventEmitter<MashupFolderItem | undefined | null | void> = new vscode.EventEmitter<MashupFolderItem | undefined | null | void>()
    readonly onDidChangeTreeData: vscode.Event<MashupFolderItem | undefined | null | void> = this._onDidChangeTreeData.event;
    public mashupData: IMashupTheme
    public activeDataProvider: ActiveDataProvider

    constructor(context: vscode.ExtensionContext, activeDataProvider: ActiveDataProvider) {
        this.activeDataProvider = activeDataProvider
        this.context = context
        this.mashupData = Custom.getMashupState(this.context)

    }
    getTreeItem(element: MashupFolderItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element
    }
    getChildren(element?: MashupFolderItem | MashupThemeItem | undefined): vscode.ProviderResult<(MashupFolderItem | MashupThemeItem)[]> {
        // RETURN FAVORITES AS ROOT ELEMENTS
        const temp: Dictionary = this.mashupData as Dictionary
        if (element === undefined) return sections.map((section: string) => {
            return new MashupFolderItem(section, vscode.TreeItemCollapsibleState.None, temp[section])
        })
        if (element.contextValue === "mashup_folder") {
            let el = element as MashupFolderItem
            if (el.child.theme) return [new MashupThemeItem(el.child, el.label)]
        }

    }
    handleDrop(target: MashupFolderItem | MashupThemeItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
        let transferData = dataTransfer.get("application/vnd.code.tree.favtreeview")
        if(!transferData){
            // HISTORY DROPS
        transferData = dataTransfer.get("application/vnd.code.tree.historytreeview")
        }
        if (transferData) {
            console.log(transferData)
            let transferItem
            try {
                transferItem = JSON.parse(transferData.value) as ThemeItem[]
            }
            catch (e) {
                return
            }
            if (!target) return
            const targetLabel: string = target?.label!
            // EXIT IF SLOT LOCKED
            if(this.mashupData[targetLabel].locked) return
            const tempDict = this.mashupData as Dictionary
            if(!tempDict[targetLabel]){
                tempDict[targetLabel] = {
                    theme: transferItem[0].theme,
                    locked: false
                }
            }
            else tempDict[targetLabel]!.theme = transferItem[0].theme
            console.log(this.mashupData)
            // UPDATE DATA MODEL
            Custom.updateMashupState(this.context, this.mashupData, this)
        }
        
    }
    // SYNC WITH STATE
    refresh(): void {
        this.mashupData = Custom.getMashupState(this.context)
        Custom.UpdateActiveMashupState(this, this.activeDataProvider, this.context)
        this._onDidChangeTreeData.fire()
    }

}

export class MashupFolderItem implements vscode.TreeItem {
    public contextValue?: string = "mashup_folder"
    public child: MashupSlot
    public description?: string | boolean | undefined;
    public locked: boolean = false
    public readonly iconPath;
    public confidence?: string
    constructor(
        public label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        mashupSlot: MashupSlot
    ) {
        this.label = label
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded
        this.contextValue = "mashup_folder"
        this.child = mashupSlot
        this.locked = this.child.locked
        this.description = this.child.theme ? (this.locked ? "(locked)" : this.child.theme.label) : "empty"
        this.iconPath = {
            light: path.join(__filename, '../', "../", "../", 'resources', `${this.locked ? "lock.svg" : "folder.png"}`),
            dark: path.join(__filename, '../', "../", "../", 'resources', `${this.locked ? "lock.svg" : "folder.png"}`)
        }
    }

}

export class MashupThemeItem implements vscode.TreeItem {
    public themeSlot: MashupSlot
    public label: string
    public collapsibleState?: vscode.TreeItemCollapsibleState | undefined;
    public contextValue?: string | undefined = "mashup_theme"
    public slot: string

    constructor(mashupSlot: MashupSlot, slot: string) {
        this.label = mashupSlot.theme ? ThemeExtUtil.GetInterfaceIdentifier(mashupSlot.theme) : "empty"
        this.themeSlot = mashupSlot
        this.collapsibleState = vscode.TreeItemCollapsibleState.None
        this.slot = slot
    }
}