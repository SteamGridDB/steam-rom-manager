import { ChangeDetectorRef, OnDestroy, PipeTransform, Pipe, WrappedValue, ɵstringify, ɵisPromise, ɵisObservable } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

class ObservableStrategy {
    createSubscription(async: Observable<any>, updateLatestValue: (value: any) => any) {
        return async.subscribe({ next: updateLatestValue, error: (e) => { throw e; } });
    }
    dispose(subscription: Subscription) { subscription.unsubscribe(); }
    onDestroy(subscription: Subscription) { subscription.unsubscribe(); }
}

class PromiseStrategy {
    createSubscription(async: Promise<any>, updateLatestValue: (value: any) => any) {
        return async.then(updateLatestValue, e => { throw e; });
    }
    dispose(subscription: Subscription) { }
    onDestroy(subscription: Subscription) { }
}

function invalidPipeArgumentError(type: any, value: any) {
    return Error(`InvalidPipeArgument: '${value}' for pipe '${ɵstringify(type)}'`);
}

//AnyZone (AZ) async pipe. Based on async pipe, except it invokes changes immediately
@Pipe({ name: 'asyncAZ', pure: false })
export class AsyncAZPipe implements OnDestroy, PipeTransform {
    private _ref: ChangeDetectorRef;
    private _latestValue : any;
    private _latestReturnedValue : any;
    private _subscription : Subscription;
    private _obj: Observable<any> | Promise<any>;
    private _strategy : PromiseStrategy | ObservableStrategy;

    constructor(_ref: ChangeDetectorRef) {
        this._ref = _ref;
        this._latestValue = null;
        this._latestReturnedValue = null;
        this._subscription = null;
        this._obj = null;
        this._strategy = null;
    }

    ngOnDestroy() {
        if (this._subscription) {
            this._dispose();
        }
    }

    transform<T>(obj: Observable<T> | Promise<T>) : T | null | WrappedValue {
        if (!this._obj) {
            if (obj) {
                this._subscribe(obj);
            }
            this._latestReturnedValue = this._latestValue;
            return this._latestValue;
        }
        if (obj !== this._obj) {
            this._dispose();
            return this.transform(obj);
        }
        if (this._latestValue === this._latestReturnedValue) {
            return this._latestReturnedValue;
        }
        this._latestReturnedValue = this._latestValue;
        return WrappedValue.wrap(this._latestValue);
    }

    _subscribe(obj: Observable<any> | Promise<any>) {
        this._obj = obj;
        this._strategy = this._selectStrategy(obj);
        this._subscription = (<any>this._strategy).createSubscription(obj, (value: any) => this._updateLatestValue(obj, value));
    }

    _selectStrategy(obj: Observable<any> | Promise<any>) {
        if (ɵisPromise(obj)) {
            return new PromiseStrategy();
        }
        if (ɵisObservable(obj)) {
            return new ObservableStrategy();
        }
        throw invalidPipeArgumentError(AsyncAZPipe, obj);
    }

    _dispose() {
        this._strategy.dispose(this._subscription);
        this._latestValue = null;
        this._latestReturnedValue = null;
        this._subscription = null;
        this._obj = null;
    }
    
    _updateLatestValue(async: Observable<any> | Promise<any>, value: any) {
        if (async === this._obj) {
            this._latestValue = value;
            this._ref.detectChanges();
        }
    }
}