import { IThemeEXT } from "./ThemeExtJSON";
import {v4  as uuid} from 'uuid'
export class Folder {
    public themes: IThemeEXT[]
    public label: string
    static folders: Folder[] = []
    public id: string
    public open: boolean = true
    constructor(themes: IThemeEXT[], label: string, initiallyOpened?: boolean){
        this.themes = themes
        this.label = label
        Folder.folders.push(this)
        this.id = uuid()
        this.open = initiallyOpened !== undefined ? initiallyOpened : true
    }
}