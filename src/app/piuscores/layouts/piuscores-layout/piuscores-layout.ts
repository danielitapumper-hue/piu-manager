import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "@piuscores/components/navbar/navbar";

@Component({
  selector: 'app-piuscores-layout',
  imports: [RouterOutlet, Navbar],
  templateUrl: './piuscores-layout.html',
})
export class PiuscoresLayout { }
