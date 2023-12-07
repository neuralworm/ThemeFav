// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as lib from './lib'
import { Sort } from './lib/sort';
import { FolderItem, ThemeItem, ThemeFavProvider } from './treeviews/TreeViewFavorites';
import { InstalledThemeItem, InstalledThemeProvider } from './treeviews/TreeViewInstalled';
import { MashupFolderItem, MashupThemeItem, MashupThemeProvider } from './treeviews/TreeViewMashups';
import { HistoryDataProvider, HistoryItem } from './treeviews/TreeViewHistory';
import {History} from './lib/history'
import { IThemeEXT } from './models/IThemeExtJSON';
import { Custom } from './lib/custom';
import { ActiveDataProvider, ActiveThemeItem } from './treeviews/TreeViewActive';
import { Folders } from './lib/folders';
import { Favorites } from './lib/favorites';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// GET EXT CONFIG
	const config = vscode.workspace.getConfiguration("themeFav")
	console.log(config.get("validateThemesOnLaunch"))
	console.log('ThemeFav now active.');
	// PROVIDERS
	const favThemeProvider = new ThemeFavProvider(context)
	const installedThemeProvider = new InstalledThemeProvider(context)
	const mashupDataProvider = new MashupThemeProvider(context)
	const historyDataProvider = new HistoryDataProvider(context)
	const activeDataProvider = new ActiveDataProvider(context)


	// WATCH FOR THEME CHANGE
	vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent)=>{
		if(!e.affectsConfiguration("workbench.colorTheme")) return
		// HISTORY UPDATE
		const theme: IThemeEXT = lib.getExtData(installedThemeProvider.installed , vscode.workspace.getConfiguration().get("workbench.colorTheme")!)
		History.addHistoryEvent(context, theme, historyDataProvider)
		activeDataProvider.refresh()
	})
	vscode.extensions.onDidChange(() => {
		// EXTENSION INSTALL EVENTS
	})
	// REGISTER TREEVIEWS
	const favoritesTreeView: vscode.TreeView<ThemeItem|FolderItem> = vscode.window.createTreeView("favtreeview", {
		treeDataProvider: favThemeProvider,
		dragAndDropController: favThemeProvider
	})
	const installedTreeView: vscode.TreeView<InstalledThemeItem> = vscode.window.createTreeView("installedtreeview", {
		treeDataProvider: installedThemeProvider,
		dragAndDropController: installedThemeProvider
	})
	const mashupTreeView: vscode.TreeView<MashupFolderItem|MashupThemeItem> = vscode.window.createTreeView("mashuptreeview", {
		treeDataProvider: mashupDataProvider,
		dragAndDropController: mashupDataProvider
	})
	const historyTreeView: vscode.TreeView<HistoryItem> = vscode.window.createTreeView("historytreeview", {
		treeDataProvider: historyDataProvider,
	})
	const activeTreeView: vscode.TreeView<ActiveThemeItem> = vscode.window.createTreeView("activetreeview", {
		treeDataProvider: activeDataProvider,
		dragAndDropController: activeDataProvider
	})
	
	// TREE VIEW SELECTION EVENTS
	favoritesTreeView.onDidChangeSelection((e: vscode.TreeViewSelectionChangeEvent<ThemeItem|FolderItem>)=>{
		if(e.selection[0].hasOwnProperty("theme")){
			//@ts-ignore
			lib.activateTheme(e.selection[0].theme)
		}
	})
	favoritesTreeView.onDidCollapseElement((e: vscode.TreeViewExpansionEvent<FolderItem|ThemeItem>) => {
		Folders.updateFolderCollapse(e.element as FolderItem, context, favThemeProvider)
	})
	favoritesTreeView.onDidExpandElement((e: vscode.TreeViewExpansionEvent<FolderItem|ThemeItem>) => {
		Folders.updateFolderCollapse(e.element as FolderItem, context, favThemeProvider)
	})
	installedTreeView.onDidChangeSelection((e: vscode.TreeViewSelectionChangeEvent<InstalledThemeItem>)=>{
		lib.activateTheme(e.selection[0].theme)
	})
	// COMMANDS
	const disposable_getFavorites = vscode.commands.registerCommand('themeFav.getFavorites', () => {
		Favorites.getFavorites(context)
	});
	const disposable_saveTheme = vscode.commands.registerCommand('themeFav.saveTheme', () => {
		Favorites.saveThemeToUncat(context, favThemeProvider)
	});
	const disposable_selectFromFavorites = vscode.commands.registerCommand('themeFav.selectFromFavorites', () => {
		lib.getCurrentTheme()
		lib.selectFavorite(context)
	});
	const disposable_removeViaCommandPalette = vscode.commands.registerCommand('themeFav.removeViaCommandPalette', () => {
		lib.removeViaCommandPalette(context, favThemeProvider)
	});
	const disposable_removeViaView = vscode.commands.registerCommand('themeFav.removeViaView', (itemCtx: ThemeItem) => {
		lib.removeThemeViaTree(itemCtx, context, favThemeProvider)
	});
	const disposable_editJSON = vscode.commands.registerCommand('themeFav.editJSON', (itemCtx: ThemeItem) => {
		lib.editThemeJSON(itemCtx, context)
	});
	const disposable_refreshTreeView = vscode.commands.registerCommand("themeFav.refreshTreeView", () => {
		favThemeProvider.refresh()
	})
	const disposable_sortAlphaAsc = vscode.commands.registerCommand("themeFav.sortAlphaAsc", (e: any) => {
		Sort.sortListAlphaAsc(context, favThemeProvider)
	})
	const disposable_sortAlphaDesc = vscode.commands.registerCommand("themeFav.sortAlphaDesc", () => {
		Sort.sortListAlphaDesc(context, favThemeProvider)
	})
	const disposable_sortFolderAlphaAsc = vscode.commands.registerCommand("themeFav.sortFolderAsc", (folderItem: FolderItem) => {
		Sort.sortFolderAlphaAsc(context, folderItem, favThemeProvider)
	})
	const disposable_sortFolderAlphaDesc = vscode.commands.registerCommand("themeFav.sortFolderDesc", (folderItem: FolderItem) => {
		Sort.sortFolderAlphaDesc(context, folderItem, favThemeProvider)
	})
	const disposable_manageFavorites = vscode.commands.registerCommand("themeFav.manage", () => {
		lib.manageMenu(context, favThemeProvider)
	})
	const disposable_validate = vscode.commands.registerCommand("themeFav.validate", () => {
		lib.validateThemes(context, favThemeProvider)
	})
	const disposable_newFolder = vscode.commands.registerCommand("themeFav.newFolder", () => {
		lib.createFolder(context, favThemeProvider)
	})
	const disposable_moveToFolder = vscode.commands.registerCommand("themeFav.moveToFolder", (e: ThemeItem) => {
		lib.moveToFolderViaPallette(context, favThemeProvider, e)
	})
	const disposable_moveToNewFolder = vscode.commands.registerCommand("themeFav.moveToNewFolder", (e: ThemeItem) => {
	})
	const disposable_moveToUncat = vscode.commands.registerCommand("themeFav.moveToDefault", (e: ThemeItem) => {
		lib.moveToUncat(context, favThemeProvider, e)
	})
	const disposable_delete = vscode.commands.registerCommand("themeFav.delete", (treeItem: vscode.TreeItem) => {
		lib.treeDelete(context, favThemeProvider, treeItem)
	})
	const disposable_renameFolder = vscode.commands.registerCommand("themeFav.renameFolder", (e: FolderItem) => {
		Folders.renameFolder(e, context, favThemeProvider)
	})
	const disposable_copyPath = vscode.commands.registerCommand("themeFav.copyPath", (e: ThemeItem) => {
		lib.copyPath(e, context, favThemeProvider)
	})
	const disposable_addTo = vscode.commands.registerCommand("themeFav.addTo", (e: InstalledThemeItem)=>{
		lib.addToFolderPallette(context, favThemeProvider, e)
	})
	const disposable_search = vscode.commands.registerCommand("themeFav.search", () => {
		lib.searchInstalled(context, installedThemeProvider, installedTreeView)
	})
	const disposable_duplicate = vscode.commands.registerCommand("themeFav.duplicateAndEdit", (e: InstalledThemeItem) => {
		lib.duplicateTheme(e, context)
	})
	const disposable_activateHistoryItem = vscode.commands.registerCommand("themeFav.activateHistoryItem", (e: HistoryItem) => {
		lib.activateTheme(e.theme)
	})
	const disposable_activateMashupTheme = vscode.commands.registerCommand("themeFav.activateMashup", (e: HistoryItem) => {
		Custom.applyUpdate(mashupDataProvider)
	})
	const disposable_removeFromMashup = vscode.commands.registerCommand("themeFav.removeFromMashup", (e: MashupThemeItem) => {
		Custom.removeMashupTheme(e, context, mashupDataProvider)
	})
	const disposable_uninstallTheme = vscode.commands.registerCommand("themeFav.uninstallTheme", (installedThemeItem: InstalledThemeItem) => {
		lib.uninstallExtension(installedThemeItem, installedThemeProvider)
	})
	const disposable_refreshInstalled = vscode.commands.registerCommand("themeFav.refreshInstalled", (installedThemeItem: InstalledThemeItem) => {
		installedThemeProvider.refresh()
	})
	const disposable_activateTheme = vscode.commands.registerCommand("themeFav.activateTheme", () => {
		lib.activateTheme(activeDataProvider.activeTheme)
	})
	const disposable_randomMashup = vscode.commands.registerCommand("themeFav.randomMashup", (e: any) => {
		console.log(e)
		Custom.generateRandomConfig(context, mashupDataProvider)
	})
	const disposable_deactivateMashupTheme = vscode.commands.registerCommand("themeFav.disableMashup", (e: any) => {
		lib.activateTheme(activeDataProvider.activeTheme)
	})
	const disposable_lockSlot = vscode.commands.registerCommand("themeFav.lockSlot", (e: MashupFolderItem) => {
	})
	const disposable_unlockSlot = vscode.commands.registerCommand("themeFav.unlockSlot", (e: MashupFolderItem) => {
	})
	context.subscriptions.push(disposable_getFavorites);
	context.subscriptions.push(disposable_selectFromFavorites);
	context.subscriptions.push(disposable_saveTheme);
	context.subscriptions.push(disposable_removeViaCommandPalette);
	context.subscriptions.push(disposable_removeViaView);
	context.subscriptions.push(disposable_editJSON);
	context.subscriptions.push(disposable_refreshTreeView);
	context.subscriptions.push(disposable_sortAlphaAsc);
	context.subscriptions.push(disposable_sortAlphaDesc);
	context.subscriptions.push(disposable_sortFolderAlphaAsc);
	context.subscriptions.push(disposable_sortFolderAlphaDesc);
	context.subscriptions.push(disposable_manageFavorites);
	context.subscriptions.push(disposable_validate);
	context.subscriptions.push(disposable_newFolder);
	context.subscriptions.push(disposable_moveToFolder);
	context.subscriptions.push(disposable_moveToUncat);
	context.subscriptions.push(disposable_delete);
	context.subscriptions.push(disposable_renameFolder);
	context.subscriptions.push(disposable_moveToNewFolder);
	context.subscriptions.push(disposable_copyPath);
	context.subscriptions.push(disposable_addTo);
	context.subscriptions.push(disposable_search);
	context.subscriptions.push(disposable_duplicate);
	context.subscriptions.push(disposable_activateHistoryItem);
	context.subscriptions.push(disposable_activateMashupTheme);
	context.subscriptions.push(disposable_deactivateMashupTheme)
	context.subscriptions.push(disposable_removeFromMashup)
	context.subscriptions.push(disposable_uninstallTheme)
	context.subscriptions.push(disposable_refreshInstalled)
	context.subscriptions.push(disposable_activateTheme)
	context.subscriptions.push(disposable_randomMashup)
	context.subscriptions.push(disposable_lockSlot)
	context.subscriptions.push(disposable_unlockSlot)





	// TEST
	let disposable_listExt = vscode.commands.registerCommand("themeFav.listExt", () => {
		lib.getInstalled()
	})
	
	let TEST_reset_state = vscode.commands.registerCommand("themeFav.TEST_RESET", () => {
		lib.resetState(context, favThemeProvider, mashupDataProvider, historyDataProvider)
	})
	context.subscriptions.push(disposable_listExt);
	context.subscriptions.push(TEST_reset_state);

}

export function deactivate() {
}
