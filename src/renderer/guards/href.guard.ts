import { Injectable } from "@angular/core";
import { CanActivate, ActivatedRouteSnapshot } from "@angular/router";

@Injectable()
export class HrefGuard implements CanActivate {
  constructor() {}

  canActivate() {
    return false;
  }
}
