import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InscricaoForm } from './inscricao-form';

describe('InscricaoForm', () => {
  let component: InscricaoForm;
  let fixture: ComponentFixture<InscricaoForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscricaoForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InscricaoForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
