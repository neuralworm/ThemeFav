import * as vscode from 'vscode'
export interface IThemeEXT {
    label: string,
    path: string,
    uiTheme: string,
    id?: string,
    uri?: vscode.Uri,
    absPath?: string,
    extID?: string,
    version?: string
}
export class ThemeExtUtil {
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
    public static GetInterfaceIdentifier = (theme: IThemeEXT): string => {
        return theme.id ? theme.id : theme.label
    }
    public static GetVersionString = (theme: IThemeEXT) => {
        let uriString: string = theme.uri?.fsPath!
        let arr = uriString.split("/")
        return arr[arr.length-1]
    }
}
// WHEN USING NAMES FOUND VIA EXTENSION SEARCH, ID'S MUST BE PRIORITIZED OVER LABELS
export const CreateThemeExtJSON = (label: string, path: string, uiTheme: string, version: string, extID?: string, id?: string | null, uri?: vscode.Uri, absPath?: string): IThemeEXT => {
    return {
        label: label,
        path: path,
        uiTheme: uiTheme,
        id: id ? id : undefined,
        absPath: absPath,
        uri: uri,
        extID: extID ? extID : undefined,
        version: version ? version : undefined
    }
}
type UITHEME = "vs-dark" | "vs" | "hc" | string