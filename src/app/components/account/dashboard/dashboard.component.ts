import { Component, ViewChild } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { User, UserAddress } from '../../../shared/interface/user.interface';
import { AccountState } from '../../../shared/state/account.state';
import { NotificationState } from '../../../shared/state/notification.state';
import { Notification } from '../../../shared/interface/notification.interface';
import { EditProfileModalComponent } from '../../../shared/components/widgets/modal/edit-profile-modal/edit-profile-modal.component';
import { ChangePasswordModalComponent } from '../../../shared/components/widgets/modal/change-password-modal/change-password-modal.component';
import { ConfirmationModalComponent } from '../../../shared/components/widgets/modal/confirmation-modal/confirmation-modal.component';
import { Logout } from '../../../shared/action/auth.action';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  @Select(AccountState.user) user$: Observable<User>;
  @Select(NotificationState.notification) notification$: Observable<Notification[]>;

  @ViewChild("profileModal") ProfileModal: EditProfileModalComponent;
  @ViewChild("passwordModal") PasswordModal: ChangePasswordModalComponent;
  @ViewChild("confirmationModal") ConfirmationModal: ConfirmationModalComponent;

  public address: UserAddress | null;
  public unreadNotificationCount: number = 0;

  constructor(private store: Store) {
    this.user$.subscribe(user => {
      this.address = user?.address?.length ? user?.address?.[0] : null;
    });
    this.notification$.subscribe((notification) => {
      this.unreadNotificationCount = notification?.filter(item => !item.read_at)?.length || 0;
    });
  }

  logout() {
    this.ConfirmationModal.openModal();
  }

  onLogoutConfirmed() {
    this.store.dispatch(new Logout());
  }

}
