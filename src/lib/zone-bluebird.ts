import * as _bluebird from 'bluebird';
import 'zone.js/dist/zone-bluebird';
declare var Zone: any;

let zone_bluebird = _bluebird.getNewLibraryCopy();
zone_bluebird.config({
    cancellation: true
});

Zone[Zone.__symbol__('bluebird')](zone_bluebird);

export const Bluebird = zone_bluebird;