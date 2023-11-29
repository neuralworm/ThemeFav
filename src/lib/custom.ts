import { IThemeEXT } from "../models/ThemeExtJSON"
import * as vscode from 'vscode'
import { ThemeFavProvider } from "../treeviews/TreeViewFavorites"
import * as fs from "fs"
import { IMashupTheme, MashupTheme, createMashupTheme } from "../models/MashupTheme"
import { MashupThemeProvider } from "../treeviews/TreeViewMashups"
import * as jsonTemplate from '../template/sections.json'
import path = require("path")
type Dictionary = {
    [index: string]: string[]
}
export namespace Custom {
    export const getTemplate = () => {

    }

    export const setCustomConfig = (customConfig: any, baseTheme?: IThemeEXT, tokens?: any) => {
        console.log("Set base theme " + baseTheme?.label)
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
        config.update("workbench.colorCustomizations", customConfig, true).then(() => {
            if(baseTheme){
                config.update("workbench.colorTheme", baseTheme.label, true).then(() => {
            
                })
            }
            if(tokens){
                config.update("editor.tokenColorCustomizations", tokens, true).then(() => {
            
                })
            }
        })
        
    }
    export const clearConfig = () => {
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
        config.update("workbench.colorCustomizations", {}, true).then(() => {
            config.update("editor.tokenColorCustomizations", "{}", true)
        })
    }
    export const generateRandom = () => {

    }

    // MASHUPS
    export const getMashupState = (context: vscode.ExtensionContext): IMashupTheme => {
        let rawData: string = context.globalState.get("themeFav_mashup")!
        // ATTEMPT TO PARSE
        let mashupTheme: IMashupTheme
        try {
            mashupTheme = JSON.parse(rawData!)
        }
        catch (e) {
            mashupTheme = createMashupTheme()
        }
        if (!rawData) mashupTheme = createMashupTheme()
        return mashupTheme
    }
    export const updateMashupState = (context: vscode.ExtensionContext, data: IMashupTheme, mashupDataProvider: MashupThemeProvider) => {
        context.globalState.update("themeFav_mashup", JSON.stringify(data)).then(() => {
            mashupDataProvider.refresh()
        })
    }
    export const createCustomConfig = (mashupTheme: IMashupTheme): any => {
        const config: any = {
        }
        for (const [key, value] of Object.entries(mashupTheme)){
            if(key === "base" || key === "tokens") continue
            if(!value) continue
            try{
                let val = value as IThemeEXT
                let jsonPath = path.resolve(val.absPath!, val.path)
                let buffer = fs.readFileSync(jsonPath)
                const themeObj: any = JSON.parse(buffer.toString())
                
                

                const dict = jsonTemplate as Dictionary
                const valuesToSearch: string[] = dict[key]

                config[key] = {
                    "Sdasd": "sdasd"
                }


            }
            catch(e){
                console.log(e)
            }
       }
       
        return config
    }
    export const applyUpdate = (mashup: IMashupTheme) => {
        const newConfig = createCustomConfig(mashup)
        setCustomConfig(newConfig, mashup.base)
    }
    export const getTokenConfig = (mashupTheme: IMashupTheme) => {

    }
}
