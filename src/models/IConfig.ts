// Represents a state of theme configuration, includes these properties:
// "workbench.colorCustomizations": {},
// "editor.tokenColorCustomizations": "{}",
// "workbench.colorTheme": "Dracula"
export class IConfig{
    public colorCustomizations: string
    public tokenColorCustomizations: string
    public colorTheme: string
    constructor(colorCustomizations: string, tokenColorCustomizations: string, colorTheme: string){
        this.colorCustomizations = colorCustomizations
        this.tokenColorCustomizations = tokenColorCustomizations
        this.colorTheme = colorTheme
    }
}