export interface ValidatorModifier<T> {
    latestVersion: string | number,
    controlProperty: string,
    fields: {
        [controlValue: string]: {
            [fields: string]: {
                method?: (oldValue: any, self: T) => any,
                oldValuePath?: string
            }
        }
    }
}