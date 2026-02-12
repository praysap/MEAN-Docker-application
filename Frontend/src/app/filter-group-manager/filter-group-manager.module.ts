import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterGroupManagerComponent } from './filter-group-manager.component';
import { FilterBuilderModule } from '../filter-builder/filter-builder.module';

@NgModule({
  declarations: [
    FilterGroupManagerComponent
  ],
  imports: [
    CommonModule,
    FilterBuilderModule
  ],
  exports: [
    FilterGroupManagerComponent
  ]
})
export class FilterGroupManagerModule { }
