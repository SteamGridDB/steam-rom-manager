import 'zone.js/dist/zone';
import 'reflect-metadata';
import '../lib/string-interpolation';
import '../lib/replace-diacritics';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

import './styles/themes.global.scss';
import './styles/fonts.global.scss';
import './styles/main.global.scss';

// Sentry setup
import { init } from '@sentry/electron'
init({dsn: 'https://6d0c7793f478480d8b82fb5d4e55ecea@o406253.ingest.sentry.io/5273341'});

if (process.env.NODE_ENV === 'production') {
  enableProdMode();
}

// Zone.js doesn't like it if Bluebird replaces the global `Promise` object.
// This will instruct Bluebird to return the original Promise.
(Promise as any).noConflict?.()

platformBrowserDynamic().bootstrapModule(AppModule);
