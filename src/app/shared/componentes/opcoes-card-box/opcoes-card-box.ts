import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-opcoes-card-box',
  imports: [RouterLink],
  templateUrl: './opcoes-card-box.html',
  styleUrl: './opcoes-card-box.css',
})
export class OpcoesCardBox {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) route!: string;
}
