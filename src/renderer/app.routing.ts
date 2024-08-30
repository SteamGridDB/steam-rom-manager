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
  ParsersListComponent,
  ViewComponent,
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
    path: "view",
    component: ViewComponent,
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
    path: "parsers-list",
    component: ParsersListComponent,
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

export const AppRoutes: ModuleWithProviders<RouterModule> =
  RouterModule.forRoot(AppRouter, {
    useHash: true,
    initialNavigation: "disabled",
  });
