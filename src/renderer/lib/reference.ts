export class Reference<Value>{
    private object: any;
    private property: string[];
    constructor(object: any, ...property: string[]) {
        this.object = object;
        this.property = property;
    }
    get value(): Value {
        if (this.property)
            return this.retrieveValue();
        else
            return this.object;
    }
    set value(value: Value) {
        if (this.property){
            let val = this.retrieveValue();
            val = value;
        }
        else
            this.object = value;
    }
    private retrieveValue() {
        let retrievedVal = this.object;
        for (var i = 0; i < this.property.length; i++) {
            retrievedVal = retrievedVal[this.property[i]];
            if (retrievedVal === undefined)
                break;
        }
        return retrievedVal;
    }
}