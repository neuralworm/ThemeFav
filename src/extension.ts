// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as lib from './lib'
import { ThemeFavProvider } from './TreeViewProvider';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const themeProvider = new ThemeFavProvider(context)
	console.log('ThemeFav now active.');
	// REGISTER TREEVIEW
	vscode.window.createTreeView("favorites-list", {
		treeDataProvider: themeProvider
	})
	// COMMANDS
	let disposable_getFavorites = vscode.commands.registerCommand('themeFav.getFavorites', () => {
		lib.getFavorites(context)
	});
	let disposable_saveTheme = vscode.commands.registerCommand('themeFav.saveTheme', () => {
		lib.saveThemeToState(context, themeProvider)
	});
	let disposable_selectFromFavorites = vscode.commands.registerCommand('themeFav.selectFromFavorites', () => {
		lib.selectFavorite(context)
	});
	let disposable_removeFromFavorites = vscode.commands.registerCommand('themeFav.removeFromFavorites', () => {
		lib.removeFromFavorites(context, themeProvider)
	});
	let disposable_refreshTreeView = vscode.commands.registerCommand("themeFav.refreshTreeView", () => {
		themeProvider.refresh()
	})
	let disposable_sortAlphaAsc = vscode.commands.registerCommand("themeFav.sortAlphaAsc", () => {
		lib.sortListAlphaAsc(context, themeProvider)
	})
	let disposable_sortAlphaDesc = vscode.commands.registerCommand("themeFav.sortAlphaDesc", () => {
		lib.sortListAlphaDesc(context, themeProvider)
	})
	context.subscriptions.push(disposable_getFavorites);
	context.subscriptions.push(disposable_selectFromFavorites);
	context.subscriptions.push(disposable_saveTheme);
	context.subscriptions.push(disposable_removeFromFavorites);
	context.subscriptions.push(disposable_refreshTreeView);
	context.subscriptions.push(disposable_sortAlphaAsc);
	context.subscriptions.push(disposable_sortAlphaDesc);

}

export function deactivate() {
}
