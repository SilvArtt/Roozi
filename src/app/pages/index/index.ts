import { Component } from '@angular/core';
import { Footer } from '../../shared/componentes/footer/footer';
import { HeaderHome } from '../../shared/componentes/headers/header-home/header-home';

@Component({
  selector: 'app-index',
  imports: [Footer, HeaderHome],
  templateUrl: './index.html',
  styleUrl: './index.css',
})
export class Index {

}
