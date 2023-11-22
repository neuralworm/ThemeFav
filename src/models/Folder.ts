import { ThemeExtJSON } from "../ThemeExtJSON";
export class Folder {
    public themes: ThemeExtJSON[]
    public label: string
    static folders: Folder[] = []
    constructor(themes: ThemeExtJSON[], label: string){
        this.themes = themes
        this.label = label
        Folder.folders.push(this)
    }
}