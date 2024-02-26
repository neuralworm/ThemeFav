import { IConfig } from "../models/IConfig"
import * as vscode from 'vscode'

// Represents saving the current overall THEME ORIENTED state of the settings (json) object.  This allows for swithing between mashups and singular theme while preserving customized properties: workbench.ColorCustomizations and editor.tokenColorCustomizations
export namespace State {
    export const SaveState = (context: vscode.ExtensionContext) => {
        // Get current state
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
        let colorTheme = config.get("workbench.colorTheme")
        let colorCustomizations = config.get("workbench.colorCustomizations")
        let editorTokens = config.get("editor.tokenColorCustomizations")

        let newSaveState = new IConfig(colorCustomizations ? JSON.stringify(colorCustomizations) : "", editorTokens ? JSON.stringify(editorTokens) : "", colorTheme ? colorTheme.toString() : "")

        console.log(newSaveState)

        context.globalState.update("state_default", JSON.stringify(newSaveState)).then(()=>{
            console.log("STATE SAVED: " + newSaveState.colorCustomizations)
        })
    }

    export const GetDefaultState = (context: vscode.ExtensionContext): IConfig|undefined => {
        let rawData: string = context.globalState.get("state_default")!
        // ATTEMPT TO PARSE
        let defaultState: IConfig|undefined
        try {
            defaultState = JSON.parse(rawData!)
        }
        catch (e) {
            defaultState = undefined
        }
        console.log(rawData)
        return defaultState
    }
}
