import { Component } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { NotificationState } from '../../../shared/state/notification.state';
import { AccountState } from '../../../shared/state/account.state';
import { MarkAsReadNotification } from '../../../shared/action/notification.action';
import { Logout } from '../../../shared/action/auth.action';
import { Notification } from "../../../shared/interface/notification.interface";
import { User } from '../../../shared/interface/user.interface';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {

  @Select(NotificationState.notification) notification$: Observable<Notification[]>;
  @Select(AccountState.user) user$: Observable<User>;

  public unreadNotificationCount: number = 0;

  constructor(private store: Store) {
    this.notification$.subscribe((notification) => {
      this.unreadNotificationCount = notification?.filter(item => !item.read_at)?.length || 0;
    });
  }

  logout() {
    this.store.dispatch(new Logout());
  }

  ngOnDestroy() {
    this.store.dispatch(new MarkAsReadNotification());
  }

}
