export interface JsonValidatorModifier {
    [controlValue: string]: {
        [fields: string]: {
            method?: (oldValue: any) => any,
            oldValuePath?: string
        }
    }
}