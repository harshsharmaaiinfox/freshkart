import { Component, ViewChild } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { AccountUser } from "../../../shared/interface/account.interface";
import { AccountState } from '../../../shared/state/account.state';
import { DeleteAddress } from '../../../shared/action/account.action';
import { AddressModalComponent } from '../../../shared/components/widgets/modal/address-modal/address-modal.component';
import { DeleteModalComponent } from '../../../shared/components/widgets/modal/delete-modal/delete-modal.component';
import { UserAddress } from '../../../shared/interface/user.interface';
import { NotificationState } from '../../../shared/state/notification.state';
import { Logout } from '../../../shared/action/auth.action';
import { Notification } from '../../../shared/interface/notification.interface';

@Component({
  selector: 'app-addresses',
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss']
})
export class AddressesComponent {

  @Select(AccountState.user) user$: Observable<AccountUser>;
  @Select(NotificationState.notification) notification$: Observable<Notification[]>;

  @ViewChild("addressModal") AddressModal: AddressModalComponent;
  @ViewChild("deleteModal") DeleteModal: DeleteModalComponent;

  public unreadNotificationCount: number = 0;

  constructor(private store: Store) {
    this.notification$.subscribe((notification) => {
      this.unreadNotificationCount = notification?.filter(item => !item.read_at)?.length || 0;
    });
  }

  logout() {
    this.store.dispatch(new Logout());
  }

  delete(action: string, data: UserAddress) {
    if (action == 'delete' && data)
      this.store.dispatch(new DeleteAddress(data.id));
  }

}
