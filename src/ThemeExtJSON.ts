export interface ThemeExtJSON {
    label: string,
    path: string,
    uiTheme: string,
    id?: string
}
// WHEN USING NAMES FOUND VIA EXTENSION SEARCH, ID'S MUST BE PRIORITIZED OVER LABELS
export const createThemeExtJSON = (label: string, path: string, uiTheme: string, id?: string|null): ThemeExtJSON => {
    return{
        label: label,
        path: path,
        uiTheme: uiTheme,
        id: id ? id : undefined
    }
}