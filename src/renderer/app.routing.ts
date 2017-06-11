import { ModuleWithProviders }  from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PreviewComponent, LoggerComponent, ParsersComponent, SettingsComponent } from './components';

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
        path: 'settings',
        component: SettingsComponent
    },
    {
        path: 'parsers/:index',
        component: ParsersComponent
    }
];

export const AppRoutes: ModuleWithProviders = RouterModule.forRoot(AppRouter, { useHash: true, initialNavigation: false });