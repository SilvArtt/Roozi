import { inject, Injectable, Injector } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  query,
  where,
} from '@angular/fire/firestore';
import { Region } from '@core/models/Region';
import { map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RegionService {
  private injector = inject(Injector);

  private get firestore(): Firestore {
    return this.injector.get(Firestore);
  }

  private regionsCache: Region[] | null = null;


  getActiveRegions(): Observable<Region[]> {
    if (this.regionsCache) {
      return of(this.regionsCache);
    }
    const regionRef = collection(this.firestore, 'regions');
    const regionQuery = query(regionRef, where('active', '==', true));
    return collectionData(regionQuery, { idField: 'id' }).pipe(
      map(regions => {
        this.regionsCache = regions as Region[];
        return this.regionsCache;
      })
    ) as Observable<Region[]>;
  }

  getAllRegions(): Observable<Region[]> {
    const regionRef = collection(this.firestore, 'regions');

    return collectionData(regionRef, {
      idField: 'id'
    }) as Observable<Region[]>;
  }

  getRegionById(id: string): Observable<Region | null> {
    const regionRef = doc(this.firestore, `regions/${id}`);

    return docData(regionRef, {
      idField: 'id'
    }) as Observable<Region | null>;
  }
}