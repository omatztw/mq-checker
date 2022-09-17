import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UploaderComponent } from './uploader/uploader.component';
import { SdtComponent } from './sdt/sdt.component';
import { CoreComponent } from './core/core.component';
import { LoginHistoryComponent } from './login-history/login-history.component';
import { LogViewerComponent } from './log-viewer/log-viewer.component';
import { TaskComponent } from './task/task.component';
import { CalcexpComponent } from './calcexp/calcexp.component';

const routes: Routes = [
  { path: '', redirectTo: 'meiq', pathMatch: 'full' },
  { path: 'meiq', component: UploaderComponent },
  { path: 'sdt', component: SdtComponent },
  { path: 'core', component: CoreComponent },
  { path: 'login', component: LoginHistoryComponent },
  { path: 'log', component: LogViewerComponent },
  { path: 'task', component: TaskComponent },
  { path: 'exp', component: CalcexpComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
