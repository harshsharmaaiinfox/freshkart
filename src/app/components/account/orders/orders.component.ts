import { Component } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { OrderState } from '../../../shared/state/order.state';
import { GetOrders } from '../../../shared/action/order.action';
import { OrderModel } from '../../../shared/interface/order.interface';
import { Params } from '../../../shared/interface/core.interface';
import { AccountState } from '../../../shared/state/account.state';
import { NotificationState } from '../../../shared/state/notification.state';
import { Logout } from '../../../shared/action/auth.action';
import { User } from '../../../shared/interface/user.interface';
import { Notification } from '../../../shared/interface/notification.interface';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent {

  @Select(OrderState.order) order$: Observable<OrderModel>;
  @Select(AccountState.user) user$: Observable<User>;
  @Select(NotificationState.notification) notification$: Observable<Notification[]>;

  public filter: Params = {
    'page': 1, // Current page number
    'paginate': 10, // Display per page,
  };

  public unreadNotificationCount: number = 0;

  constructor(private store: Store) {
    this.store.dispatch(new GetOrders(this.filter));

    this.notification$.subscribe((notification) => {
      this.unreadNotificationCount = notification?.filter(item => !item.read_at)?.length || 0;
    });
  }

  logout() {
    this.store.dispatch(new Logout());
  }

  setPaginate(page: number) {
    this.filter['page'] = page;
    this.store.dispatch(new GetOrders(this.filter));
  }

}
