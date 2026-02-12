import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterBuilderComponent } from './filter-builder.component';
import { FilterAstService } from './filter-ast.service';

@NgModule({
  declarations: [
    FilterBuilderComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [
    FilterAstService
  ],
  exports: [
    FilterBuilderComponent
  ]
})
export class FilterBuilderModule { }
