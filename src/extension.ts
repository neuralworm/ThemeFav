// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as lib from './lib'
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('ThemeFav now active.');
	let disposable_getFavorites = vscode.commands.registerCommand('favoritethemes.getFavorites', () => {
		lib.getFavorites(context)
	});
	let disposable_saveTheme = vscode.commands.registerCommand('favoritethemes.saveTheme', () => {
		lib.saveThemeToState(context)
	});
	let disposable_selectFromFavorites = vscode.commands.registerCommand('favoritethemes.selectFromFavorites', () => {
		lib.selectFavorite(context)
	});
	let disposable_removeFromFavorites = vscode.commands.registerCommand('favoritethemes.removeFromFavorites', () => {
		lib.removeFromFavorites(context)
	});
	context.subscriptions.push(disposable_getFavorites);
	context.subscriptions.push(disposable_selectFromFavorites);
	context.subscriptions.push(disposable_saveTheme);
	context.subscriptions.push(disposable_removeFromFavorites);
}

export function deactivate() {
}
