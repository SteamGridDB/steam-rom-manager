import { ModuleWithProviders }  from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PreviewComponent, LoggerComponent, ParsersComponent, HacksComponent } from './components';

const AppRouter: Routes = [
    {
        path: '',
        component: PreviewComponent
    },
    {
        path: 'preview',
        component: PreviewComponent
    },
    {
        path: 'logger',
        component: LoggerComponent
    },
    {
        path: 'hacks',
        component: HacksComponent
    },
    {
        path: 'parsers/:index',
        component: ParsersComponent
    },
    {
        path: '**',
        component: PreviewComponent
    },
];

export const AppRoutes: ModuleWithProviders = RouterModule.forRoot(AppRouter, { useHash: true });