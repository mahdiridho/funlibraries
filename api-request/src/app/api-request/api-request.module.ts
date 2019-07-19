import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ApiRequestComponent } from './api-request.component';
import { ApiRequestService } from './api-request.service';

@NgModule({
  declarations: [ApiRequestComponent],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [ApiRequestService],
  exports: [ApiRequestComponent]
})
export class ApiRequestModule { }
