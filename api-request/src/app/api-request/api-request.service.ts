import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class ApiRequestService {
  private baseUrl: string;
  private headers: any;
  private body: any = null;

  constructor(private http: HttpClient) { }

  /**
   * Setting up the base api url
   * @param url The base url
   */
  setUrl(url) {
    if (url)
      this.baseUrl = url;
  }

  /**
   * Set the header config for the request
   * @param params Header key and value, must be an object {key:val, ...}
   */
  private setHeader(params) {
    if (typeof params != "object")
      throw Error('The params provided is not an object type. You provided : '+params)
    
    this.headers = { headers: new HttpHeaders(params) }
  }

  /**
   * Set the header config for the request
   * @param params Header key and value, must be an object {key:val, ...}
   */
  private setBody(params) {
    if (typeof params != "object")
      throw Error('The params provided is not an object type. You provided : '+params)
    this.body = JSON.stringify(params);
  }

  /**
   * Make an api request
   * @param method The request method get or post, default get
   * @param endpoint The api endpoint url
   * @param body The request body
   * @param header The request header
   */
  call(method: string = 'get', endpoint: string, body: any, header: any): Observable<any> {
    if (body)
      this.setBody(body)
    if (header)
      this.setHeader(header)

    return this.http[method]<any>(
      this.baseUrl + ((endpoint) ? endpoint : ""), 
      (this.body) ? this.body : {}, 
      (this.headers) ? this.headers : {}
    ).pipe(
      catchError((e: HttpErrorResponse)=>{
        return throwError(e.message || "Failed System");
      })
    )
  }
}
