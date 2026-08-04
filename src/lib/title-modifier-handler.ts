import {
    TitleModifiers,
    TitleModifierKey,
    TITLE_MODIFIER_KEYS,
    ParsedData,
} from "../models";


// light-weight class enforcing that we are allowed exactly one write 
// per title modifier per successfully parsed entry

export class TitleModifierHandler {
    private _titleModifiers: TitleModifiers[] = [];
    private _currentModifier: (TitleModifierKey | null)[] = []; // null is a sentinel meaning spent; no more modifications allowed
    latestTitle: string[] = []
    constructor(parsedData: ParsedData) {
        for(let i = 0; i < parsedData.success.length; i++) {
            this._titleModifiers.push({
                extracted: parsedData.success[i].extractedTitle,
                postShortcutPassthrough: null,
                postCustomVariables: null,
                postFuzzy: null,
                postTitleModifier: null,
                final: null
            })
            this.latestTitle.push(parsedData.success[i].extractedTitle)
        }
        
        this._currentModifier = Array(parsedData.success.length).fill(
            TITLE_MODIFIER_KEYS[1]
        )
        
    }
    
    getTitleModifiers(i: number) {
        return this._titleModifiers[i];
    }
    
    getCurrentModifer(i: number) {
        return this._currentModifier[i];
    }
    
    advanceModifier(i: number, newTitleModifier: keyof TitleModifiers, newTitle: string) {
        if(this._currentModifier[i] == null) { return }
        
        const newIndex = TITLE_MODIFIER_KEYS.indexOf(newTitleModifier);
        const currentIndex = TITLE_MODIFIER_KEYS.indexOf(this._currentModifier[i])
        
        if(
            currentIndex <= newIndex &&
            newIndex < TITLE_MODIFIER_KEYS.length
        ) {
            
            for (let s = currentIndex; s < newIndex; s++) {
                this._titleModifiers[i][TITLE_MODIFIER_KEYS[s]] = this._titleModifiers[i][TITLE_MODIFIER_KEYS[currentIndex - 1]]
            }
            if(newTitle) {
                this._titleModifiers[i][TITLE_MODIFIER_KEYS[newIndex]] = newTitle;
            } else {
                this._titleModifiers[i][TITLE_MODIFIER_KEYS[newIndex]] = this._titleModifiers[i][TITLE_MODIFIER_KEYS[currentIndex]]
            }
            this.latestTitle[i] = this._titleModifiers[i][TITLE_MODIFIER_KEYS[newIndex]];
            
            if(newIndex + 1 < TITLE_MODIFIER_KEYS.length) {
                this._currentModifier[i] = TITLE_MODIFIER_KEYS[newIndex + 1]
            } else {
                this._currentModifier[i] = null;
            }
            
        }
        
    }
    
    lockModifier(i: number) {
        if(this._currentModifier[i] !== null) {
            const currentIndex = TITLE_MODIFIER_KEYS.indexOf(this._currentModifier[i])
            for(let s = currentIndex; s < TITLE_MODIFIER_KEYS.length; s++) {
                this._titleModifiers[i][TITLE_MODIFIER_KEYS[s]] = this._titleModifiers[i][TITLE_MODIFIER_KEYS[currentIndex - 1]]
            }
            this._currentModifier[i] = null;
        }
    }
}