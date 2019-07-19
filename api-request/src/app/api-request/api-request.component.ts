import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ApiRequestService } from './api-request.service';

@Component({
  selector: 'api-request',
  template: ``
})
export class ApiRequestComponent {
  @Output() public apiEvent = new EventEmitter();

  constructor(private service: ApiRequestService) { }

  // once set the base url, init the api service
  @Input() set baseUrl(baseUrl: string) {
    console.log("API::setBaseUrl")
    if (baseUrl) {
      this.service.setUrl(baseUrl);
      this.apiEvent.emit("ready");
    }
  }
}
