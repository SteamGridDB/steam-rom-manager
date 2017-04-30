import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ParsersService } from '../services';
import { UserConfiguration } from '../models';
import { Observable } from 'rxjs';

@Component({
    selector: 'nav',
    templateUrl: '../templates/nav.component.html',
    styleUrls: [
        '../styles/nav.component.scss'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavComponent {
    private userConfigurations: Observable<UserConfiguration[]>;

    constructor(private parsersService: ParsersService) {
        this.userConfigurations = this.parsersService.getUserConfigurations();
    }
}