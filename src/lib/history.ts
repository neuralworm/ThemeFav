import * as vscode from 'vscode'
import { IThemeEXT } from '../models/IThemeExtJSON'
import { HistoryDataProvider } from '../treeviews/TreeViewHistory'
export namespace History {

    export const updateHistoryState = (newHistory: IThemeEXT[], context: vscode.ExtensionContext, historyProvider: HistoryDataProvider) => {
        context.globalState.update("themeFav_history", JSON.stringify(newHistory)).then((val) => {
            historyProvider.refresh()
        })
    }
    export const getHistory = (context: vscode.ExtensionContext): IThemeEXT[] => {
        let history: string | undefined = context.globalState.get("themeFav_history")
        try {
            JSON.parse(history!)
        }
        catch (e) {
            history = "[]"
        }
        if (!history) history = "[]"
        const historyArray: IThemeEXT[] = JSON.parse(history)
        return historyArray
    }
    export const addHistoryEvent = (context: vscode.ExtensionContext, newHistoryTheme: IThemeEXT, HistoryDataProvider: HistoryDataProvider) => {
        const history: IThemeEXT[] = getHistory(context)
        // Check if exists in history
        const index: number = history.map((val: IThemeEXT) => val.label).indexOf(newHistoryTheme.label)
        if (index !== -1) history.splice(index, 1)
        history.unshift(newHistoryTheme)
        if (history.length > 40) history.pop()
        updateHistoryState(history, context, HistoryDataProvider)
    }
}