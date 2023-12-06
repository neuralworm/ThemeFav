import * as vscode from 'vscode'
import { IThemeEXT, ThemeExtUtil } from '../models/IThemeExtJSON';
import * as lib from '../lib'
import path = require('path');
import { IMashupTheme, MashupSlot, MashupTheme, createMashupTheme } from '../models/IMashupTheme';
import { Custom } from '../lib/custom';
import { ThemeItem } from './TreeViewFavorites';
import { sections } from '../constants/mashupsections';

const mashupTemp: IMashupTheme = createMashupTheme()
type Dictionary = {
    [index: string]: MashupSlot
}

export class MashupThemeProvider implements vscode.TreeDataProvider<MashupFolderItem | MashupThemeItem>, vscode.TreeDragAndDropController<MashupFolderItem | MashupThemeItem>{
    dropMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
    dragMimeTypes = ['application/vnd.code.tree.favtreeview', "text/plain"];
    context: vscode.ExtensionContext
    private _onDidChangeTreeData: vscode.EventEmitter<MashupFolderItem | undefined | null | void> = new vscode.EventEmitter<MashupFolderItem | undefined | null | void>()
    readonly onDidChangeTreeData: vscode.Event<MashupFolderItem | undefined | null | void> = this._onDidChangeTreeData.event;
    public mashupData: IMashupTheme

    constructor(context: vscode.ExtensionContext) {
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
        const transferData = dataTransfer.get("application/vnd.code.tree.favtreeview")
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
        Custom.applyUpdate(this)
        this._onDidChangeTreeData.fire()
    }

}

export class MashupFolderItem implements vscode.TreeItem {
    public contextValue?: string = "mashup_folder"
    public child: MashupSlot
    public description?: string | boolean | undefined;
    public readonly iconPath = {
        light: path.join(__filename, '../', "../", "../", 'resources', 'folder.png'),
        dark: path.join(__filename, '../', "../", "../", 'resources', 'folder.png')
    }
    public locked: boolean = false
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
        this.description = this.child.theme ? this.child.theme.label : "empty"
    }

}

export class MashupThemeItem implements vscode.TreeItem {
    public themeSlot: MashupSlot
    public label: string
    public collapsibleState?: vscode.TreeItemCollapsibleState | undefined;
    public contextValue?: string | undefined = "mashup_theme"
    public slot: string

    constructor(mashupSlot: MashupSlot, slot: string) {
        this.label = mashupSlot.theme ? mashupSlot.theme.label : "empty"
        this.themeSlot = mashupSlot
        this.collapsibleState = vscode.TreeItemCollapsibleState.None
        this.slot = slot
    }
}