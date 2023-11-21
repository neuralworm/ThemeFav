export interface ThemeExtJSON {
    label: string,
    path: string,
    uiTheme: string,
    id?: string
}
export const createThemeExtJSON = (label: string, path: string, uiTheme: string, id?: string|null): ThemeExtJSON => {
    return{
        label: label,
        path: path,
        uiTheme: uiTheme,
        id: id ? id : undefined
    }
}