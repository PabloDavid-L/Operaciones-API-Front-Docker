import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoList } from './tipo-list';

describe('TipoList', () => {
  let component: TipoList;
  let fixture: ComponentFixture<TipoList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
