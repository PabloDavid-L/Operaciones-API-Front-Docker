import { Routes } from '@angular/router';
import { CafeListComponent } from './components/cafe-list/cafe-list';
import { CafeFormComponent } from './components/cafe-form/cafe-form';
import { TipoListComponent } from './components/tipo-list/tipo-list';
import { TipoFormComponent } from './components/tipo-form/tipo-form';

export const routes: Routes = [
  // Si la ruta está vacía (''), redirige a '/cafes'
  { path: '', redirectTo: 'cafes', pathMatch: 'full' }, 
  
  // Cuando la URL sea '/cafes', carga CafeListComponent
  { path: 'cafes', component: CafeListComponent },            // Ruta principal
  { path: 'cafes/nuevo', component: CafeFormComponent },      // Para Crear
  { path: 'cafes/editar/:id', component: CafeFormComponent },  // Para Editar

  // --- Rutas de Tipos ---
  { path: 'tipos', component: TipoListComponent },
  { path: 'tipos/nuevo', component: TipoFormComponent },
  { path: 'tipos/editar/:id', component: TipoFormComponent }
];