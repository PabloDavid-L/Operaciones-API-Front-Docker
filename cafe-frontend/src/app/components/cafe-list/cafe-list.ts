import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api';
import { Cafe } from '../../interfaces/cafe.interface';
import { Tipo } from '../../interfaces/tipo.interface';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TipoSelectorComponent } from '../tipo-selector/tipo-selector';

@Component({
  selector: 'app-cafe-list', //HTML : <app-cafe-list>
  standalone: true,
  imports: [CommonModule, TipoSelectorComponent, RouterModule],
  templateUrl: './cafe-list.html',
  styleUrls: ['./cafe-list.css']
})
export class CafeListComponent implements OnInit {

  cafes: Cafe[] = [];
  tipos: Tipo[] = [];
  errorCarga: string = '';
  
  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    // Carga inicial (todos los cafés)
    this.cargarCafes(); 
  }

  // Modificar cargarCafes para aceptar filtros 
  cargarCafes(filtros: { tipoId?: number } = {}): void {
    this.errorCarga = '';
    
    // Preparamos los parámetros para el QueryDTO del backend
    const params: any = {
      limit: 20,
      page: 1,
    };

    if (filtros.tipoId) {
      params.tipoId = filtros.tipoId;
    }

    // Llamamos al servicio con los filtros
    this.apiService.getCafes(params).subscribe({
      next: (data) => {
        this.cafes = data;
      },
      error: (err) => {
        console.error('Error cargando cafés', err);
        this.errorCarga = 'No se pudo conectar con el servidor. Por favor, revisa tu conexión.';
      }
    });
  }

  borrarCafe(id: number): void {
    if (confirm('¿Estás seguro de eliminar este café?')) {
      this.apiService.deleteCafe(id).subscribe({
        next: () => {
          this.cargarCafes(); 
        },
        error: (err) => {
          alert('No se pudo eliminar el café. Puede que ya no exista.');
        }
      });
    }
  }

  // Método que recibe el evento del componente hijo 
  onTipoFiltrado(tipoId: number | null): void {
    if (tipoId) {
      // Si recibimos un ID, filtramos
      this.cargarCafes({ tipoId: tipoId });
    } else {
      // Si recibimos null (clic en "Mostrar Todos"), cargamos sin filtro
      this.cargarCafes();
    }
  }
}
