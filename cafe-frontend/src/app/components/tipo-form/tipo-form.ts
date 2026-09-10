import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';
import { CreateTipoDto } from '../../interfaces/create-tipo.dto';

@Component({
  selector: 'app-tipo-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tipo-form.html',
  styleUrls: ['./tipo-form.css']
})
export class TipoFormComponent implements OnInit {
  tipo: CreateTipoDto = {
    name: '',
    description: ''
  };

  esEdicion = false;
  idTipoEditar: number | null = null;
  mensajeError: string = ''; // Para mostrar errores en el HTML

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.esEdicion = true;
        this.idTipoEditar = +id;
        this.apiService.getTipoById(this.idTipoEditar).subscribe({
          next: (data) => {
            this.tipo = { name: data.name, description: data.description };
          },
          error: (err) => {
            console.error(err);
            this.mensajeError = 'No se pudo cargar el tipo para editar.';
          }
        });
      }
    });
  }

  guardarTipo() {
    this.mensajeError = ''; // Limpiar errores previos

    const observable = (this.esEdicion && this.idTipoEditar)
      ? this.apiService.updateTipo(this.idTipoEditar, this.tipo)
      : this.apiService.createTipo(this.tipo);

    observable.subscribe({
      next: () => {
        alert(this.esEdicion ? '¡Tipo actualizado!' : '¡Tipo creado con éxito!');
        this.router.navigate(['/tipos']);
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        this.mensajeError = err.error?.message || 'Ocurrió un error al guardar el tipo. Verificá los datos.';
      }
    });
  }
}