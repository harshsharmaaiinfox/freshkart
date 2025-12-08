import { Component, OnInit, OnDestroy } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoaderState } from '../../shared/state/loader.state';
import { Breadcrumb } from '../../shared/interface/breadcrumb';
import { GetNotification } from '../../shared/action/notification.action';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {

  @Select(LoaderState.status) loadingStatus$: Observable<boolean>;

  public open: boolean = false;
  public isDashboardRoute: boolean = false;
  public breadcrumb: Breadcrumb = {
    title: "Dashboard",
    items: [{ label: 'Dashboard', active: false }]
  };

  private routerSubscription: any;

  constructor(private store: Store, private router: Router) {
    this.store.dispatch(new GetNotification());
    this.updateBreadcrumb();
    this.checkDashboardRoute();
  }

  ngOnInit() {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateBreadcrumb();
        this.checkDashboardRoute();
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private updateBreadcrumb() {
    this.breadcrumb.title = this.router?.url?.split('?')[0]?.split('/')?.pop()!;
    if (this.router?.url.includes('order/details')) {
      this.breadcrumb.title = 'Order';
    }
    this.breadcrumb.items = [];
    this.breadcrumb.items.push({ label: this.breadcrumb.title, active: false });
  }

  private checkDashboardRoute() {
    const url = this.router?.url?.split('?')[0];
    this.isDashboardRoute = url === '/account/dashboard' || url === '/account/dashboard/' ||
      url === '/account/notifications' || url === '/account/notifications/' ||
      url === '/account/bank-details' || url === '/account/bank-details/' ||
      url === '/account/order' || url === '/account/order/' ||
      url === '/account/refund' || url === '/account/refund/' ||
      url === '/account/addresses' || url === '/account/addresses/' ||
      url.startsWith('/account/order/details');
  }

  openMenu(value: boolean) {
    this.open = value;
  }

}
