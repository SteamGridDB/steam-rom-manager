import 'zone.js/dist/zone';
import 'reflect-metadata';

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

import './styles/global.themes.scss';
import './styles/global.fonts.scss';
import './styles/global.font-awesome.scss';
import './styles/global.main.scss';

if (process.env.NODE_ENV === 'production')
    enableProdMode();

platformBrowserDynamic().bootstrapModule(AppModule);