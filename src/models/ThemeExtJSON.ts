import * as vscode from 'vscode'
export interface ThemeExtJSON {
    label: string,
    path: string,
    uiTheme: string,
    id?: string,
    uri?: vscode.Uri,
    absPath?: string
}
export class ThemeExtJSON2 {
    label: string
    path: string
    uiTheme: string
    id?: string|null
    constructor(label: string, path: string, uiTheme: string, id?: string | null) {
        this.label = label
        this.path = path
        this.uiTheme = uiTheme
        this.id = id ? id : null
    }
    public getIdentifier = (): string => {
        return this.id ? this.id : this.label
    }
    public static getInterfaceIdentifier = (theme: ThemeExtJSON): string => {
        return theme.id ? theme.id : theme.label
    }
}
// WHEN USING NAMES FOUND VIA EXTENSION SEARCH, ID'S MUST BE PRIORITIZED OVER LABELS
export const createThemeExtJSON = (label: string, path: string, uiTheme: string, id?: string | null, uri?: vscode.Uri, absPath?: string): ThemeExtJSON => {
    return {
        label: label,
        path: path,
        uiTheme: uiTheme,
        id: id ? id : undefined,
        absPath: absPath,
        uri: uri
        
    }
}
type UITHEME = "vs-dark" | "vs" | "hc" | string