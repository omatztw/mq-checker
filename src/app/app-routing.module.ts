import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UploaderComponent } from './uploader/uploader.component';
import {SdtComponent} from './sdt/sdt.component';
import { CoreComponent } from './core/core.component';


const routes: Routes = [
  { path: '', redirectTo: 'meiq', pathMatch: 'full'},
  {path: 'meiq', component: UploaderComponent},
  {path: 'sdt', component: SdtComponent},
  {path: 'core', component: CoreComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
