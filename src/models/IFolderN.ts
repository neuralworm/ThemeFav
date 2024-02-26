import { IThemeEXT } from "./IThemeExtJSON";
import {v4  as uuid} from 'uuid'
class IFolderN{
    public items: (IThemeEXT|IFolderN)[]
    public label: string
    public id: string
    public open: boolean = true
    constructor(items: (IThemeEXT|IFolderN)[], label: string, initiallyOpened?: boolean){
        this.items = items
        this.label = label
        this.id = uuid()
        this.open = initiallyOpened !== undefined ? initiallyOpened : true
}
}