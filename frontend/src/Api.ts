import axios from "axios";
import type {Method, AxiosInstance} from "axios"

export class Api {
  private api: AxiosInstance = axios.create({
    baseURL: "https://api.twttr.alst.superluminar.io/v1/" // TODO: Should go into env later
  });

  private async apiRequest(method: Method, url: string, data: any): Promise<any> {
    const headers = {
      authorization: ""
    };

    //using the axios instance to perform the request that received from each http method
    return this.api({
      method,
      url,
      data,
      headers
    }).then(res => {
      return Promise.resolve(res.data);
    })
      .catch(err => {
        return Promise.reject(err);
      });
  };


  // function to execute the http get request
  get(url: string, data?: any) {return this.apiRequest("get", url, data)};

  // function to execute the http delete request
  delete(url: string, data?: any) {return this.apiRequest("delete", url, data)};

  // function to execute the http post request
  post(url: string, data?: any) {return this.apiRequest("post", url, data)};

  // function to execute the http put request
  put(url: string, data?: any) {return this.apiRequest("put", url, data)};

  // function to execute the http path request
  patch(url: string, data?: any) {return this.apiRequest("patch", url, data)};
}
