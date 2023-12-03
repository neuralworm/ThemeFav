import { IThemeEXT } from "./IThemeExtJSON";
import {v4  as uuid} from 'uuid'
export class IFolder {
    public themes: IThemeEXT[]
    public label: string
    static folders: IFolder[] = []
    public id: string
    public open: boolean = true
    constructor(themes: IThemeEXT[], label: string, initiallyOpened?: boolean){
        this.themes = themes
        this.label = label
        IFolder.folders.push(this)
        this.id = uuid()
        this.open = initiallyOpened !== undefined ? initiallyOpened : true
    }
}