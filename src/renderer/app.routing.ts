import { ModuleWithProviders } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import {
  AppComponent,
  PreviewComponent,
  LoggerComponent,
  ParsersComponent,
  SettingsComponent,
  AboutComponent,
  ExceptionsComponent,
} from "./components";
import { HrefGuard } from "./guards";

const AppRouter: Routes = [
  {
    path: "",
    component: PreviewComponent,
  },
  {
    path: "preview",
    component: PreviewComponent,
  },
  {
    path: "logger",
    component: LoggerComponent,
  },
  {
    path: "user-exceptions",
    component: ExceptionsComponent,
  },
  {
    path: "settings",
    component: SettingsComponent,
  },
  {
    path: "parsers/:index",
    component: ParsersComponent,
  },
  {
    path: "about",
    component: AboutComponent,
  },
  {
    path: "**",
    component: AppComponent,
    canActivate: [HrefGuard],
  },
];

export const AppRoutes: ModuleWithProviders = RouterModule.forRoot(AppRouter, {
  useHash: true,
  initialNavigation: false,
});
