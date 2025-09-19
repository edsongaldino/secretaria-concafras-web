import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InscricaoList } from './inscricao-list';

describe('InscricaoList', () => {
  let component: InscricaoList;
  let fixture: ComponentFixture<InscricaoList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscricaoList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InscricaoList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
