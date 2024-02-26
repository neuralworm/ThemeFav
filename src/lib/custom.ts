import { MashupFolderItem, MashupThemeItem, MashupThemeProvider } from './../treeviews/TreeViewMashups';
import { IThemeEXT, ThemeExtUtil } from "../models/IThemeExtJSON"
import * as fs from "fs"
import * as vscode from 'vscode'

import { IMashupTheme, MashupSlot, MashupTheme, createMashupTheme } from "../models/IMashupTheme"
import { MashupThemeProvider as MashupDataProvider } from "../treeviews/TreeViewMashups"
import * as jsonTemplate from '../template/sections.json'
import path = require("path")
import { jsonrepair } from "jsonrepair"
import { sections } from '../constants/mashupsections';
import { getRandomTheme } from '../lib';
import { ActiveDataProvider } from '../treeviews/TreeViewActive';
import { State } from './state';
import { IConfig } from '../models/IConfig';
import { Console } from 'console';

type Dictionary = {
    [index: string]: string[]
}
type StringIndexable = {
    [index: string]: MashupSlot | undefined
}
export namespace Custom {
    export const SetCustomConfig = async (context: vscode.ExtensionContext, activeDataProvider: ActiveDataProvider, customConfig: any, baseTheme?: IThemeEXT, tokens?: any) => {
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
        if (!activeDataProvider.mashupActive) {
            console.log("ENTERING MASHUP MODE")
            State.SaveState(context)
        }
        // SAVE CURRENT THEME STATE TO PERSISTANCE
        await Promise.all([
            config.update("workbench.colorCustomizations", customConfig, true),
            baseTheme ? config.update("workbench.colorTheme", ThemeExtUtil.GetInterfaceIdentifier(baseTheme), true) : null,
            config.update("editor.tokenColorCustomizations", tokens ? tokens : {}, true)
        ])
       
    }

    export const clearConfig = () => {
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
        config.update("workbench.colorCustomizations", {}, true).then(() => {
            config.update("editor.tokenColorCustomizations", {}, true)
        })
    }
    export const ResetToDefault = async (forceTheme: IThemeEXT | undefined, context: vscode.ExtensionContext) => {
        const previousConfig: IConfig | undefined = State.GetDefaultState(context)
        if (previousConfig == null) return
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
        console.log(previousConfig.colorCustomizations)
        console.log(previousConfig.tokenColorCustomizations)
        console.log(previousConfig.colorTheme)
        console.log(forceTheme?.label)
        await Promise.all([
            config.update("workbench.colorTheme", forceTheme ? ThemeExtUtil.GetInterfaceIdentifier(forceTheme) : previousConfig.colorTheme, vscode.ConfigurationTarget.Global),
            config.update("workbench.colorCustomizations", JSON.parse(previousConfig.colorCustomizations), vscode.ConfigurationTarget.Global),
            config.update("editor.tokenColorCustomizations", JSON.parse(previousConfig.tokenColorCustomizations), vscode.ConfigurationTarget.Global)
        ])



    }
    export const GenerateRandomConfig = (context: vscode.ExtensionContext, dataProvider: MashupDataProvider, activeDataProvider: ActiveDataProvider) => {
        const mashTheme: IMashupTheme = createMashupTheme()
        const mashupState: IMashupTheme = getMashupState(context)
        sections.forEach((sectionString: string) => {
            // IF LOCKED, KEEP SET STATE
            if (mashupState[sectionString].locked) mashTheme[sectionString] = mashupState[sectionString]
            // ELSE GET RANDOM
            else mashTheme[sectionString].theme = getRandomTheme()
        })
        const randomConfig = CreateCustomConfig(mashTheme, dataProvider)
        updateMashupState(context, mashTheme, dataProvider)
        SetCustomConfig(context, activeDataProvider, randomConfig, randomConfig["base"], getTokenConfig(randomConfig["tokens"]))

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
        // console.log(mashupTheme)
        return mashupTheme
    }
    export const updateMashupState = (context: vscode.ExtensionContext, data: IMashupTheme, mashupDataProvider: MashupDataProvider) => {
        context.globalState.update("themeFav_mashup", JSON.stringify(data)).then(() => {
            mashupDataProvider.refresh()
        })
    }
    export const removeMashupTheme = (e: MashupThemeItem, context: vscode.ExtensionContext, dataProvider: MashupDataProvider) => {
        const state: IMashupTheme = getMashupState(context)
        const stateD = state as StringIndexable
        if (!stateD[e.slot]) return
        stateD[e.slot]!.theme = undefined
        updateMashupState(context, state, dataProvider)
    }
    export const CreateCustomConfig = (mashupTheme: IMashupTheme, dataProvider: MashupThemeProvider): any => {
        const config: any = {
        }
        for (const [key, value] of Object.entries(mashupTheme)) {
            if (key === "base" || key === "tokens") continue
            if (!value || !value.theme) continue
            try {
                // if(value.locked) continue
                let val = value.theme as IThemeEXT
                let jsonPath = path.resolve(val.absPath!, val.path)
                let buffer = fs.readFileSync(jsonPath)
                const JSONstring: string = buffer.toString()
                // REPAIR JSON
                const repaired = jsonrepair(JSONstring)

                const themeObj: any = JSON.parse(repaired)
                // @ts-ignore
                const dict = jsonTemplate as Dictionary
                const valuesToSearch: string[] = dict[key]

                let count = 0
                valuesToSearch.forEach((val: string) => {
                    if (!themeObj.colors) return
                    if (val in themeObj.colors) {
                        // console.log("found " + val)
                        try {
                            config[val] = themeObj.colors[val]
                            count++
                        }
                        catch (e) {
                            console.log(e)
                        }
                    }

                })
                // GET FOREGROUND AND BACKGROUND IF EDITOR LOCATION SPECIFIC ONES NOT SPECIFIED
                // try{
                //     if(!key+".foreground") config[`${key}.foreground`] = themeObj.colors["foreground"]
                //     console.log(themeObj.colors["foreground"])

                // }
                // catch(e){

                // }
                // try{
                //     if(!key+".background") config[`${key}.background`] = themeObj.colors["editor.background"]
                //     console.log(themeObj.colors["editor.background"])
                // }
                // catch(e){

                // }
                // CONFIDENCE
                // console.log(getMashupConfidence(valuesToSearch.length, count))
            }
            catch (e) {
                console.log(e)
            }
        }
        // console.log(config)
        return config
    }
    export const UpdateActiveMashupState = (mashupDataProvider: MashupDataProvider, activeDataProvider: ActiveDataProvider, context: vscode.ExtensionContext) => {
        const data: IMashupTheme = mashupDataProvider.mashupData
        const newConfig = CreateCustomConfig(data, mashupDataProvider)
        let baseTheme: IThemeEXT | undefined
        if (data.base) {
            baseTheme = data.base.theme
        }
        else baseTheme = undefined
        let tokenTheme: IThemeEXT | undefined
        if (data.tokens) {
            tokenTheme = data.tokens.theme
        }
        else tokenTheme = undefined
        SetCustomConfig(context, activeDataProvider, newConfig, baseTheme, tokenTheme ? getTokenConfig(tokenTheme) : undefined)
        activeDataProvider.mashupActive = true
        activeDataProvider.refresh()
    }

    export const getTokenConfig = (mashupTheme: IThemeEXT): any => {
        try {
            let jsonPath = path.resolve(mashupTheme.absPath!, mashupTheme.path)
            let buffer = fs.readFileSync(jsonPath)
            const JSONstring: string = buffer.toString()
            // REPAIR JSON
            const repaired = jsonrepair(JSONstring)

            const themeObj: any = JSON.parse(repaired)
            // @ts-ignore
            // console.log("tokens: " + themeObj.tokenColors)
            const config: any = {
                "textMateRules": themeObj.tokenColors
            }
            return config
        }
        catch (e) {
            return undefined
        }
    }
    export const getMashupConfidence = (possibleValues: number, foundValues: number): string => {
        const perc = (foundValues * 100) / possibleValues
        return `${perc < 10 ? "Pointless" : (perc < 30 ? "Ineffective" : (perc < 70 ? "Effective" : "Very Effective"))} (${foundValues}/${possibleValues})`
    }
    // SLOTS
    export const lockSlot = (folderItem: MashupFolderItem, context: vscode.ExtensionContext, dataProvider: MashupDataProvider) => {
        const mashupState: IMashupTheme = getMashupState(context)
        const slotLabel: string = folderItem.label
        mashupState[slotLabel].locked = !folderItem.locked
        updateMashupState(context, mashupState, dataProvider)
    }
    // Descativation and reinstatement of default config
    export const DisableMashup = (context: vscode.ExtensionContext) => {
        // GET SAVED STATE
        let previousState: IConfig | undefined = State.GetDefaultState(context)
        if (!previousState) return
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
        config.update("workspace.colorTheme", previousState.colorTheme)
    }
}
