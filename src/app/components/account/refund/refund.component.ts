import { Component } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { RefundState } from '../../../shared/state/refund.state';
import { GetRefund } from '../../../shared/action/refund.action';
import { RefundModel } from '../../../shared/interface/refund.interface';
import { Params } from '../../../shared/interface/core.interface';
import { AccountState } from '../../../shared/state/account.state';
import { NotificationState } from '../../../shared/state/notification.state';
import { Logout } from '../../../shared/action/auth.action';
import { User } from '../../../shared/interface/user.interface';
import { Notification } from '../../../shared/interface/notification.interface';

@Component({
  selector: 'app-refund',
  templateUrl: './refund.component.html',
  styleUrls: ['./refund.component.scss']
})
export class RefundComponent {

  @Select(RefundState.refund) refund$: Observable<RefundModel>;
  @Select(AccountState.user) user$: Observable<User>;
  @Select(NotificationState.notification) notification$: Observable<Notification[]>;

  public unreadNotificationCount: number = 0;

  public filter: Params = {
    'page': 1, // Current page number
    'paginate': 10, // Display per page,
  };

  constructor(private store: Store) {
    this.store.dispatch(new GetRefund(this.filter));

    this.notification$.subscribe((notification) => {
      this.unreadNotificationCount = notification?.filter(item => !item.read_at)?.length || 0;
    });
  }

  logout() {
    this.store.dispatch(new Logout());
  }

  setPaginate(page: number) {
    this.filter['page'] = page;
    this.store.dispatch(new GetRefund(this.filter));
  }

}
