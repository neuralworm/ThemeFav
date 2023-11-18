// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as lib from './lib'
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// STATE
	let state = context.globalState
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "favoritethemes" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	
	let disposable_getFavorites = vscode.commands.registerCommand('favoritethemes.getFavorites', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		lib.getFavorites(context)
	});
	let disposable_saveTheme = vscode.commands.registerCommand('favoritethemes.saveTheme', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		lib.saveTheme(context)
	});
	let disposable_selectFromFavorites = vscode.commands.registerCommand('favoritethemes.selectFromFavorites', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		lib.selectFavorite(context)
	});
	context.subscriptions.push(disposable_getFavorites);
	context.subscriptions.push(disposable_saveTheme);
	context.subscriptions.push(disposable_selectFromFavorites);


}

// this method is called when your extension is deactivated
export function deactivate() {}
