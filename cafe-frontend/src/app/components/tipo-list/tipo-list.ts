import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';
import { Tipo } from '../../interfaces/tipo.interface';

@Component({
  selector: 'app-tipo-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tipo-list.html',
  styleUrls: ['./tipo-list.css']
})
export class TipoListComponent implements OnInit {
  tipos: Tipo[] = [];
  errorCarga: string = ''; // Nueva variable

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.cargarTipos();
  }

  cargarTipos() {
    this.errorCarga = '';
    this.apiService.getTipos().subscribe({
      next: (data) => {
        this.tipos = data;
      },
      error: (err) => {
        console.error('Error cargando tipos', err);
        this.errorCarga = 'No se pudo conectar con el servidor para cargar los tipos.';
      }
    });
  }

  borrarTipo(id: number) {
    if(confirm('¿Seguro que querés borrar este tipo?')) {
      this.apiService.deleteTipo(id).subscribe({
        next: () => {
          this.cargarTipos();
        },
        error: (err) => {
          // El error más común aquí es que el tipo tenga cafés asociados (Foregin Key constraint)
          alert('No se pudo eliminar el tipo. Verificá que no tenga cafés asociados.');
          console.error(err);
        }
      });
    }
  }
}
