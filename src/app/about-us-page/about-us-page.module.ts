import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutUsPageRoutingModule } from './about-us-page-routing.module';
import { AboutUsPageComponent } from './about-us-page.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    AboutUsPageComponent
  ],
  imports: [
    CommonModule,
    AboutUsPageRoutingModule,
    SharedModule
  ]
})
export class AboutUsPageModule { }
