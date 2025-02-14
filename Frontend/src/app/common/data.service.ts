import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class DataService {

  private newDataKey = 'newData';
  private newData = new BehaviorSubject<any>(this.retrieveDataFromLocalStorage());

  constructor() { }

  private retrieveDataFromLocalStorage(): any {
    const storedData = localStorage.getItem(this.newDataKey);
    return storedData ? JSON.parse(storedData) : { alert: '' };

  }


  private saveDataToLocalStorage(data: any): void {
    localStorage.setItem(this.newDataKey, JSON.stringify(data));
  }

  setNewDataInfo(data: any) {
    this.newData.next(data);
    this.saveDataToLocalStorage(data);
  }

  getNewDataInfo() {
    return this.newData.asObservable();
  }
}
