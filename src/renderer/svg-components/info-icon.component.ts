import { Component, Input } from '@angular/core';

@Component({
    selector: 'svg[info-icon]',
    template: `
        <svg:circle cx="150" cy="150" r="145"/>
        <svg:text text-anchor="middle" x="150" y="150" dy="0.35em">i</svg:text>
    `,
    host: {
        viewBox: "0 0 300 300",
        version: "1.1",
        xmlns: "http://www.w3.org/2000/svg",
        '[class.hover]': 'hover'
    },
    styles: [`
        :host{
            height: 1em;
            vertical-align: middle;
        }
        circle{
            stroke-width: 15; 
            stroke: var(--color-info-button); 
            fill: var(--color-info-button-background);
        }
        text{
            font-size: 256px; 
            font-family: 'Roboto'; 
            fill: var(--color-info-button);
        }
        :host(.hover):hover{
            cursor: pointer;
        }
        :host(.hover):hover circle{
            cursor: pointer;
            stroke: var(--color-info-button-hover); 
            fill: var(--color-info-button-background-hover);
        }
        :host(.hover):hover text{
            cursor: pointer;
            stroke: var(--color-info-button-hover);
        }
    `]
})
export class InfoIconComponent {
    @Input() hover: boolean;
}