// src/app/components/tipo-selector/tipo-selector.component.ts
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { Tipo } from '../../interfaces/tipo.interface';

@Component({
  selector: 'app-tipo-selector',
  standalone: true,
  imports: [CommonModule], // Necesario para *ngFor
  templateUrl: './tipo-selector.html',
  styleUrls: ['./tipo-selector.css']
})
export class TipoSelectorComponent implements OnInit {

  tipos: Tipo[] = [];

  // Emitirá el ID del tipo seleccionado (o null si es "Todos")
  @Output() tipoSeleccionado = new EventEmitter<number | null>();

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    // Cuando el componente carga, pide los tipos a la API
    this.apiService.getTipos().subscribe(data => {
      this.tipos = data;
    });
  }

  // Función que se llamará al hacer clic en un tipo
  seleccionarTipo(id: number | null): void {
    console.log('Tipo seleccionado:', id);
    // Emite el evento hacia el padre
    this.tipoSeleccionado.emit(id);
  }
}
