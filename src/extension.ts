// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as lib from './lib'
import { FolderItem, ThemeItem, ThemeFavProvider } from './TreeViewProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// GET EXT CONFIG
	const config = vscode.workspace.getConfiguration("themeFav")
	console.log(config.get("validateThemesOnLaunch"))
	console.log('ThemeFav now active.');
	const themeProvider = new ThemeFavProvider(context)
	// WATCH FOR THEME CHANGE
	vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent)=>{
		console.log(e.affectsConfiguration("workbench.colorTheme"))
		// HISTORY UPDATE
		lib.addHistoryEvent(context, vscode.workspace.getConfiguration().get("workbench.colorTheme")!, themeProvider)
	})
	// REGISTER TREEVIEW
	const favoritesTreeView = vscode.window.createTreeView("favtreeview", {
		treeDataProvider: themeProvider
	})
	// TREE VIEW SELECTION EVENTS
	favoritesTreeView.onDidChangeSelection((e: vscode.TreeViewSelectionChangeEvent<ThemeItem|FolderItem>)=>{
		if(e.selection[0].hasOwnProperty("theme")){
			//@ts-ignore
			lib.activateTheme(e.selection[0].theme)
		}
	})
	favoritesTreeView.onDidCollapseElement((e: vscode.TreeViewExpansionEvent<FolderItem|ThemeItem>) => {
		lib.updateFolderCollapse(e.element as FolderItem, context, themeProvider)
	})
	favoritesTreeView.onDidExpandElement((e: vscode.TreeViewExpansionEvent<FolderItem|ThemeItem>) => {
		lib.updateFolderCollapse(e.element as FolderItem, context, themeProvider)
	})
	// COMMANDS
	const disposable_getFavorites = vscode.commands.registerCommand('themeFav.getFavorites', () => {
		lib.getFavorites(context)
	});
	const disposable_saveTheme = vscode.commands.registerCommand('themeFav.saveTheme', () => {
		lib.saveThemeToState(context, themeProvider)
	});
	const disposable_selectFromFavorites = vscode.commands.registerCommand('themeFav.selectFromFavorites', () => {
		lib.getCurrentTheme()
		lib.selectFavorite(context)
	});
	const disposable_removeViaCommandPalette = vscode.commands.registerCommand('themeFav.removeViaCommandPalette', () => {
		lib.removeViaCommandPalette(context, themeProvider)
	});
	const disposable_removeViaView = vscode.commands.registerCommand('themeFav.removeViaView', (itemCtx: ThemeItem) => {
		lib.removeThemeViaTree(itemCtx, context, themeProvider)
	});
	const disposable_editJSON = vscode.commands.registerCommand('themeFav.editJSON', (itemCtx: ThemeItem) => {
		lib.editThemeJSON(itemCtx, context)
	});
	const disposable_refreshTreeView = vscode.commands.registerCommand("themeFav.refreshTreeView", () => {
		themeProvider.refresh()
	})
	const disposable_sortAlphaAsc = vscode.commands.registerCommand("themeFav.sortAlphaAsc", (e: any) => {
		lib.sortListAlphaAsc(context, themeProvider)
	})
	const disposable_sortAlphaDesc = vscode.commands.registerCommand("themeFav.sortAlphaDesc", () => {
		lib.sortListAlphaDesc(context, themeProvider)
	})
	const disposable_manageFavorites = vscode.commands.registerCommand("themeFav.manage", () => {
		lib.manageMenu(context, themeProvider)
	})
	const disposable_validate = vscode.commands.registerCommand("themeFav.validate", () => {
		lib.validateThemes(context, themeProvider)
	})
	const disposable_newFolder = vscode.commands.registerCommand("themeFav.newFolder", () => {
		lib.createFolder(context, themeProvider)
	})
	const disposable_moveToFolder = vscode.commands.registerCommand("themeFav.moveToFolder", (e: ThemeItem) => {
		lib.moveToFolderViaPallette(context, themeProvider, e)
	})
	const disposable_moveToNewFolder = vscode.commands.registerCommand("themeFav.moveToNewFolder", (e: ThemeItem) => {
	})
	const disposable_delete = vscode.commands.registerCommand("themeFav.delete", (treeItem: vscode.TreeItem) => {
		lib.treeDelete(context, themeProvider, treeItem)
	})
	const disposable_renameFolder = vscode.commands.registerCommand("themeFav.renameFolder", (e: FolderItem) => {
		lib.renameFolder(e, context, themeProvider)
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
	context.subscriptions.push(disposable_delete);
	context.subscriptions.push(disposable_renameFolder);
	context.subscriptions.push(disposable_moveToNewFolder);



	// TEST
	let disposable_listExt = vscode.commands.registerCommand("themeFav.listExt", () => {
		lib.getInstalled()
	})
	
	let TEST_reset_state = vscode.commands.registerCommand("themeFav.TEST_RESET", () => {
		lib.resetState(context, themeProvider)
	})
	context.subscriptions.push(disposable_listExt);
	context.subscriptions.push(TEST_reset_state);

}

export function deactivate() {
}
