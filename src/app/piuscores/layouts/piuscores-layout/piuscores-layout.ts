import { Component } from '@angular/core';
import { Navbar } from "../../components/navbar/navbar";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-piuscores-layout',
  imports: [Navbar, RouterOutlet],
  templateUrl: './piuscores-layout.html',
})
export class PiuscoresLayout { }
