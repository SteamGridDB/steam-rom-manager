import 'zone.js';
import 'reflect-metadata';
import '../lib/string-interpolation';
import '../lib/replace-diacritics';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

import './styles/themes.global.scss';
import './styles/fonts.global.scss';
import './styles/main.global.scss';

if (process.env.NODE_ENV === 'production') {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
