// src/app/services/api.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
//importat environment
import { environment } from '../../environments/environment';

// Importa las interfaces que definimos
import { Cafe } from '../interfaces/cafe.interface';
import { Tipo } from '../interfaces/tipo.interface';
import { CreateCafeDto } from '../interfaces/create-cafe.dto';
import { CreateTipoDto } from '../interfaces/create-tipo.dto';
import { UpdateTipoDto } from '../interfaces/update-tipo.dto';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  // Inyecta el HttpClient de Angular
  constructor(private http: HttpClient) { }

  // --- MÉTODOS DE TIPOS ---

  /** Obtiene todos los tipos */
  getTipos(): Observable<Tipo[]> {
    return this.http.get<Tipo[]>(`${this.apiUrl}/tipos`);
  }

  /** Obtiene un tipo por su ID */
  getTipoById(id: number): Observable<Tipo> {
    return this.http.get<Tipo>(`${this.apiUrl}/tipos/${id}`);
  }

  /** Crea un nuevo tipo */
  createTipo(tipo: CreateTipoDto): Observable<Tipo> {
    return this.http.post<Tipo>(`${this.apiUrl}/tipos`, tipo);
  }

  /** Actualiza un tipo existente */
  updateTipo(id: number, tipo: UpdateTipoDto): Observable<Tipo> {
    return this.http.patch<Tipo>(`${this.apiUrl}/tipos/${id}`, tipo);
  }

  /** Elimina un tipo por su ID */
  deleteTipo(id: number): Observable<Tipo> {
    return this.http.delete<Tipo>(`${this.apiUrl}/tipos/${id}`);
  }

  // --- MÉTODOS DE CAFES ---

  /** Obtiene cafés con filtros, paginación y ordenamiento (usando tipoId) */
  getCafes(params: {
    tipoId?: number,
    description?: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    orderBy?: 'ASC' | 'DESC'
  }): Observable<Cafe[]> {
    
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      // Solo añadimos el parámetro si tiene un valor
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    // Envía la petición a GET /cafes con los parámetros de consulta
    return this.http.get<Cafe[]>(`${this.apiUrl}/cafes`, { params: httpParams });
  }

  /** Obtiene un café por su ID */
  getCafeById(id: number): Observable<Cafe> {
    return this.http.get<Cafe>(`${this.apiUrl}/cafes/${id}`);
  }

  /** Crea un nuevo café POST */
  createCafe(cafeDto: CreateCafeDto): Observable<Cafe> {
    return this.http.post<Cafe>(`${this.apiUrl}/cafes`, cafeDto);
  }

  /** Actualiza un café existente (usando DTO con tipoId opcional) */
  updateCafe(id: number, cafeDto: Partial<CreateCafeDto>): Observable<Cafe> {
    return this.http.patch<Cafe>(`${this.apiUrl}/cafes/${id}`, cafeDto);
  }

  /** Elimina un café DELETE*/
  deleteCafe(id: number): Observable<Cafe> {
    return this.http.delete<Cafe>(`${this.apiUrl}/cafes/${id}`);
  }
}