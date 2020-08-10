import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UploaderComponent } from './uploader/uploader.component';
import {SdtComponent} from './sdt/sdt.component';


const routes: Routes = [
  { path: '', redirectTo: 'meiq', pathMatch: 'full'},
  {path: 'meiq', component: UploaderComponent},
  {path: 'sdt', component: SdtComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
