import { Component, Input } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AttributeService } from '../../../../../shared/services/attribute.service';
import { Params } from '../../../../../shared/interface/core.interface';
import { AttributeModel } from '../../../../../shared/interface/attribute.interface';
import { AttributeState } from '../../../../../shared/state/attribute.state';
import { GetAttributes } from '../../../../../shared/action/attribute.action';
import { BrandState } from '../../../../../shared/state/brand.state';
import { BrandModel } from '../../../../../shared/interface/brand.interface';
import { GetBrands } from '../../../../../shared/action/brand.action';

@Component({
  selector: 'app-collection-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class CollectionSidebarComponent {

  @Input() filter: Params;
  @Input() hideFilter: string[];

  @Select(AttributeState.attribute) attribute$: Observable<AttributeModel>;
  @Select(BrandState.brand) brand$: Observable<BrandModel>;

  public sorting = [
    { value: 'asc', label: 'Ascending Order' },
    { value: 'desc', label: 'Descending Order' },
    { value: 'low-high', label: 'Low - High Price' },
    { value: 'high-low', label: 'High - Low Price' },
    { value: 'a-z', label: 'A - Z Order' },
    { value: 'z-a', label: 'Z - A Order' },
    { value: 'discount-high-low', label: '% Off - Hight To Low' }
  ];

  constructor(private store: Store,
    public attributeService: AttributeService,
    private route: ActivatedRoute,
    private router: Router) {
    this.store.dispatch(new GetAttributes({ status: 1 }));
    this.store.dispatch(new GetBrands({ status: 1 }));
  }

  closeCanvasMenu() {
    this.attributeService.offCanvasMenu = false;
  }

  // SortBy Filter
  sortByFilter(event: any) {
    const value = event.target.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sortBy: value ? value : null,
      },
      queryParamsHandling: 'merge', // preserve the existing query params in the route
      skipLocationChange: false  // do trigger navigation
    });
  }

  getSortBy() {
    return this.filter ? this.filter['sortBy'] : '';
  }
}
