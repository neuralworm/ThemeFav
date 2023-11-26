// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as lib from './lib'
import { FolderItem, ThemeItem, ThemeFavProvider } from './treeviews/TreeViewFavorites';
import { InstalledThemeItem, InstalledThemeProvider } from './treeviews/TreeViewInstalled';
import { MashupItem, MashupThemeProvider } from './treeviews/TreeViewMashups';
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
	const mashupThemeProvider = new MashupThemeProvider(context)
	// WATCH FOR THEME CHANGE
	vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent)=>{
		if(!e.affectsConfiguration("workbench.colorTheme")) return
		// HISTORY UPDATE
		lib.addHistoryEvent(context, vscode.workspace.getConfiguration().get("workbench.colorTheme")!, favThemeProvider)
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
	const mashupTreeView: vscode.TreeView<MashupItem> = vscode.window.createTreeView("mashuptreeview", {
		treeDataProvider: mashupThemeProvider,
		dragAndDropController: mashupThemeProvider
	})
	// TREE VIEW SELECTION EVENTS
	favoritesTreeView.onDidChangeSelection((e: vscode.TreeViewSelectionChangeEvent<ThemeItem|FolderItem>)=>{
		if(e.selection[0].hasOwnProperty("theme")){
			//@ts-ignore
			lib.activateTheme(e.selection[0].theme)
		}
	})
	favoritesTreeView.onDidCollapseElement((e: vscode.TreeViewExpansionEvent<FolderItem|ThemeItem>) => {
		lib.updateFolderCollapse(e.element as FolderItem, context, favThemeProvider)
	})
	favoritesTreeView.onDidExpandElement((e: vscode.TreeViewExpansionEvent<FolderItem|ThemeItem>) => {
		lib.updateFolderCollapse(e.element as FolderItem, context, favThemeProvider)
	})
	installedTreeView.onDidChangeSelection((e: vscode.TreeViewSelectionChangeEvent<InstalledThemeItem>)=>{
		lib.activateTheme(e.selection[0].theme)
	})
	// COMMANDS
	const disposable_getFavorites = vscode.commands.registerCommand('themeFav.getFavorites', () => {
		lib.getFavorites(context)
	});
	const disposable_saveTheme = vscode.commands.registerCommand('themeFav.saveTheme', () => {
		lib.saveThemeToUncat(context, favThemeProvider)
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
		lib.sortListAlphaAsc(context, favThemeProvider)
	})
	const disposable_sortAlphaDesc = vscode.commands.registerCommand("themeFav.sortAlphaDesc", () => {
		lib.sortListAlphaDesc(context, favThemeProvider)
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
		lib.renameFolder(e, context, favThemeProvider)
	})
	const disposable_copyPath = vscode.commands.registerCommand("themeFav.copyPath", (e: ThemeItem) => {
		lib.copyPath(e, context, favThemeProvider)
	})
	const disposable_addTo = vscode.commands.registerCommand("themeFav.addTo", (e: InstalledThemeItem)=>{
		lib.moveToFolderViaPallette(context, favThemeProvider, e)
	})
	const dispoasable_search = vscode.commands.registerCommand("themeFav.search", () => {
		lib.searchInstalled(context, installedThemeProvider, installedTreeView)
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
	context.subscriptions.push(dispoasable_search);




	// TEST
	let disposable_listExt = vscode.commands.registerCommand("themeFav.listExt", () => {
		lib.getInstalled()
	})
	
	let TEST_reset_state = vscode.commands.registerCommand("themeFav.TEST_RESET", () => {
		lib.resetState(context, favThemeProvider)
	})
	context.subscriptions.push(disposable_listExt);
	context.subscriptions.push(TEST_reset_state);

}

export function deactivate() {
}
