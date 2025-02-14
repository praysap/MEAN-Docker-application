import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { environment } from 'src/environments/environment';
import { RestService } from './rest.service';

@Injectable({
  providedIn: 'root'
})
export class MapserviceService {

  capitals: string = '/assets/mapDemo/mapDemo.json';
  dummyData: string = '/assets/mapDemo/indicator-demo.json';
  // capitals: string = this.allNodes;
  constructor(private http: HttpClient, private restServ: RestService) {
    // this.getAllNodes();
  }

  getLiveMap(map: L.Map, allNodes: any, mapType = 'small'): void {
    let lat: any;
    let lon: any;
    for (const c of allNodes) {
      lat = c.lat;
      lon = c.lng;
      let marker: any;

      if (mapType == 'full-map') {
        marker = L.marker([lat, lon], {
          title: c.organization
        });
      } else {
        const icon = L.divIcon({
          html: `<div class="ringring"></div><div class="circle"></div>`,
          className: 'ring-container'
        })
        const ll = L.latLng(lat, lon)

        marker = L.marker(ll, {
          icon: icon,
          title: c.organization
        })
      }

      marker.on('click', (e: any) => {
        var popup = L.popup()
          .setLatLng(e.latlng)
          .setContent(`<div class="map-popup"><p>${c.organization}</p></div>`)
          .openOn(map);
      });
      marker.addTo(map);
    }
  }

  makeCapitalMarkers(map: L.Map): void {
    this.http.get(this.capitals).subscribe((res: any) => {
      for (const c of res.features) {
        const lon = c.geometry.coordinates[0];
        const lat = c.geometry.coordinates[1];
        const marker = L.marker([lat, lon]);
        marker.addTo(map);
      }
    });
  }

  addKashmirBorderLineToMap(map: any, color: string) {
    let url = environment.assetPath + '/mapDemo/india-boundary.json';
    this.http.get(url).subscribe((json: any) => {
      const latLngs = L.GeoJSON.coordsToLatLngs(json.coordinates, 2);
      var polyLine = L.polyline(latLngs, {
        color: color,
        weight: 0.5,
        opacity: 1
      }).addTo(map);
    });
  }

  getDummyData() {
    return this.http.get(this.dummyData);
  }
}
