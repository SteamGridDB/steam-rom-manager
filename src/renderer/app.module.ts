import { NgModule } from "@angular/core";
import { BrowserModule, Title } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DatePipe, PercentPipe, APP_BASE_HREF } from "@angular/common";
import { ColorPickerModule } from "ngx-color-picker";

import * as Components from "./components";
import * as SvgComponents from "./svg-components";
import * as Services from "./services";
import * as Directives from "./directives";
import * as Pipes from "./pipes";
import * as Guards from "./guards";
import { AppRoutes } from "./app.routing";
import { DragAndDropModule } from "angular-draggable-droppable";

// Unfortunately not usable for declarations right now, as the strictly typed compiler can't evaluate statically
// Ideally one would have declarations: [...ngObjectsToArray<Components(Components), etc]
function ngObjectsToArray<T>(importObject: T) {
  let objectArray: T[keyof T][] = [];
  for (let attribute in importObject) {
    if (typeof importObject[attribute] === "function")
      objectArray.push(importObject[attribute]);
  }
  return objectArray as T[keyof T][];
}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutes,
    FormsModule,
    ReactiveFormsModule,
    ColorPickerModule,
    DragAndDropModule,
  ],
  declarations: [
    Components.AboutComponent,
    Components.AlertComponent,
    Components.AppComponent,
    Components.ChooseAccountsComponent,
    Components.ExceptionsComponent,
    Components.LoggerComponent,
    Components.MarkdownComponent,
    Components.NavBorderComponent,
    Components.NavComponent,
    Components.NavExpandComponent,
    Components.NavLinkComponent,
    Components.NavParsersComponent,
    Components.NavareaComponent,
    Components.NgBubblesComponent,
    Components.NgNestedFormComponent,
    Components.NgOptionComponent,
    Components.NgPathInputComponent,
    Components.NgSelectComponent,
    Components.NgTextInputComponent,
    Components.NgToggleButtonComponent,
    Components.ParsersComponent,
    Components.ParsersListComponent,
    Components.PreviewComponent,
    Components.SettingsComponent,
    Components.SplashComponent,
    Components.TitleComponent,
    Components.UpdateNotifierComponent,
    Components.ViewComponent,
    SvgComponents.AddImagesComponent,
    SvgComponents.CopyIconComponent,
    SvgComponents.ImageAlertComponent,
    SvgComponents.ImageLensComponent,
    SvgComponents.RefreshImagesComponent,
    SvgComponents.SaveImagesComponent,
    SvgComponents.SelectArrowDownComponent,
    SvgComponents.SelectArrowLeftComponent,
    SvgComponents.SelectArrowRightComponent,
    SvgComponents.XDeleteComponent,
    Directives.TextScrollDirective,
    Directives.VarDirective,
    Directives.InViewDirective,
    Directives.HoverClassDirective,
    Pipes.ArrayConcatPipe,
    Pipes.CssUrl,
    Pipes.FileImage,
    Pipes.FormControlPipe,
    Pipes.IndexedFormControlPipe,
    Pipes.FormGroupPipe,
    Pipes.FuzzyTestPipe,
    Pipes.IntersectionTestPipe,
    Pipes.KeyPipe,
    Pipes.KeysPipe,
    Pipes.RangeArrayPipe,
    Pipes.SafeHtml,
    Pipes.SafeResourceUrl,
    Pipes.SafeStyle,
  ],
  providers: [].concat(
    ngObjectsToArray(Services),
    ngObjectsToArray(Guards),
    ngObjectsToArray(Pipes),
    { provide: APP_BASE_HREF, useValue: "SRM" },
    DatePipe,
    PercentPipe,
    Title,
  ),
  bootstrap: [Components.AppComponent],
})
export class AppModule {}
