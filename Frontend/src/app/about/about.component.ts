import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {MatTableModule} from '@angular/material/table';
import jsPDF from 'jspdf'

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O'},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F'},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne'},
];



@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  public apiUrl=environment.API_URL;
  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  dataSource = ELEMENT_DATA;
  Listtrackigobjct: any;

constructor(public http:HttpClient){}
  ngOnInit():void{
    const currentUrl = window.location.href;
    this.storeCurrentUrl(currentUrl).subscribe(
        //response => console.log(response),
       // error => console.error(error)
    );
  }
  storeCurrentUrl(currentUrl: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/store-info`, { currentUrl });
  }


  downloadPdf() {
    var prepare:any=[];
    this.dataSource.forEach((e: { position: any; name: any; weight: any; symbol: any;  })=>{
      var tempObj =[];
      tempObj.push(e.position);
      tempObj.push(e.name);
      tempObj.push( e.weight);
      tempObj.push( e.symbol);
     
      prepare.push(tempObj);
    });
    const doc = new jsPDF();
    (doc as any).autoTable({
        head: [['No','Name','Weight','Symbol']],
        body: prepare
    });
    doc.save('Vehicules_List' + '.pdf');
  }
}


