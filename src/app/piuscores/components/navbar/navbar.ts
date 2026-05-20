import { Component } from '@angular/core';
import { LoginModal } from "../../../auth/components/login-modal/login-modal";

@Component({
  selector: 'app-navbar',
  imports: [LoginModal],
  templateUrl: './navbar.html',
})
export class Navbar { }
