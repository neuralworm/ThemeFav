// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as lib from './lib'
import { ThemeFav, ThemeFavProvider } from './TreeViewProvider';

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
	const favoritesTreeView = vscode.window.createTreeView("favorites-list", {
		treeDataProvider: themeProvider
	})
	// TREE VIEW SELECTION EVENTS
	favoritesTreeView.onDidChangeSelection((e: vscode.TreeViewSelectionChangeEvent<ThemeFav>)=>{
		lib.activateTheme(e.selection[0].theme)
	})
	// COMMANDS
	let disposable_getFavorites = vscode.commands.registerCommand('themeFav.getFavorites', () => {
		lib.getFavorites(context)
	});
	let disposable_saveTheme = vscode.commands.registerCommand('themeFav.saveTheme', () => {
		lib.saveThemeToState(context, themeProvider)
	});
	let disposable_selectFromFavorites = vscode.commands.registerCommand('themeFav.selectFromFavorites', () => {
		lib.getCurrentTheme()
		lib.selectFavorite(context)
	});
	let disposable_removeViaCommandPalette = vscode.commands.registerCommand('themeFav.removeViaCommandPalette', () => {
		lib.removeViaCommandPalette(context, themeProvider)
	});
	let disposable_removeViaView = vscode.commands.registerCommand('themeFav.removeViaView', (itemCtx: ThemeFav) => {
		lib.removeViaView(itemCtx, context, themeProvider)
	});
	let disposable_editJSON = vscode.commands.registerCommand('themeFav.editJSON', (itemCtx: ThemeFav) => {
		lib.editThemeJSON(itemCtx, context)
	});
	let disposable_refreshTreeView = vscode.commands.registerCommand("themeFav.refreshTreeView", () => {
		themeProvider.refresh()
	})
	let disposable_sortAlphaAsc = vscode.commands.registerCommand("themeFav.sortAlphaAsc", (e: any) => {
		lib.sortListAlphaAsc(context, themeProvider)
	})
	let disposable_sortAlphaDesc = vscode.commands.registerCommand("themeFav.sortAlphaDesc", () => {
		lib.sortListAlphaDesc(context, themeProvider)
	})
	let disposable_manageFavorites = vscode.commands.registerCommand("themeFav.manage", () => {
		lib.manageFavoritesViaPallette(context, themeProvider)
	})
	let disposable_validate = vscode.commands.registerCommand("themeFav.validate", () => {
		lib.validateThemes(context, themeProvider)
	})
	let disposable_newFolder = vscode.commands.registerCommand("themeFav.newFolder", () => {
		lib.createFolder(context, themeProvider)
	})
	let disposable_moveToFolder = vscode.commands.registerCommand("themeFav.move", (e: ThemeFav) => {
		lib.moveToFolderViaPallette(context, themeProvider, e)
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
