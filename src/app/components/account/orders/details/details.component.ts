import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, of, Subscription, interval } from 'rxjs';
import { switchMap, mergeMap, takeUntil, takeWhile } from 'rxjs/operators';
import { DownloadInvoice, ViewOrder } from '../../../../shared/action/order.action';
import { GetOrderStatus } from '../../../../shared/action/order-status.action';
import { OrderState } from '../../../../shared/state/order.state';
import { OrderStatusState } from '../../../../shared/state/order-status.state';
import { Order } from '../../../../shared/interface/order.interface';
import { OrderStatusModel } from '../../../../shared/interface/order-status.interface';
import { RefundModalComponent } from '../../../../shared/components/widgets/modal/refund-modal/refund-modal.component';
import { PayModalComponent } from '../../../../shared/components/widgets/modal/pay-modal/pay-modal.component';
import { CartService } from '../../../../shared/services/cart.service';
import { AccountState } from '../../../../shared/state/account.state';
import { NotificationState } from '../../../../shared/state/notification.state';
import { Logout } from '../../../../shared/action/auth.action';
import { User } from '../../../../shared/interface/user.interface';
import { Notification } from '../../../../shared/interface/notification.interface';

@Component({
  selector: 'app-order-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class OrderDetailsComponent {

  @Select(OrderStatusState.orderStatus) orderStatus$: Observable<OrderStatusModel>;
  @Select(AccountState.user) user$: Observable<User>;
  @Select(NotificationState.notification) notification$: Observable<Notification[]>;
  @ViewChild("refundModal") RefundModal: RefundModalComponent;
  @ViewChild("payModal") PayModal: PayModalComponent;

  private destroy$ = new Subject<void>();
  private pollingSubscription!: Subscription;
  private pollingInterval = 5000; // Poll every 5 seconds
  public isLogin: boolean;
  public unreadNotificationCount: number = 0;

  public order: Order;

  constructor(private store: Store,
    private route: ActivatedRoute,
    private cartService: CartService) {
    this.store.dispatch(new GetOrderStatus());

    this.notification$.subscribe((notification) => {
      this.unreadNotificationCount = notification?.filter(item => !item.read_at)?.length || 0;
    });
  }

  logout() {
    this.store.dispatch(new Logout());
  }

  ngOnInit() {
    this.isLogin = !!this.store.selectSnapshot(state => state.auth && state.auth.access_token)
    this.route.params
      .pipe(
        switchMap(params => {
          if (!params['id']) return of();
          return this.store
            .dispatch(new ViewOrder(params['id']))
            .pipe(mergeMap(() => this.store.select(OrderState.selectedOrder)))
        }
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(order => {
        this.order = order!;
        // Check payment status for pending RaylomShop_nabu orders
        if (this.order &&
          this.order.payment_method === 'RaylomShop_nabu' &&
          this.order.payment_status === 'PENDING' &&
          this.order.uuid) {
          this.checkPaymentStatus();
        }
      });
  }

  checkPaymentStatus() {
    if (!this.order || !this.order.uuid) return;

    // Stop any existing polling
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }

    let maxAttempts = 60; // Poll for maximum 5 minutes (60 attempts * 5 seconds)
    let attemptCount = 0;

    this.pollingSubscription = interval(this.pollingInterval).pipe(
      switchMap(() => {
        attemptCount++;
        return this.cartService.checkTransectionStatusNeoKred(this.order.uuid!, this.order.payment_method);
      }),
      takeWhile((response: any) => {
        // Stop if payment is completed
        if (response?.status === true) {
          // Payment completed, refresh the order
          if (this.order?.id) {
            this.store.dispatch(new ViewOrder(this.order.id)).subscribe(() => {
              this.store.select(OrderState.selectedOrder).pipe(takeUntil(this.destroy$)).subscribe(updatedOrder => {
                if (updatedOrder) {
                  this.order = updatedOrder;
                }
              });
            });
          }
          return false;
        }
        // Stop if max attempts reached
        if (attemptCount >= maxAttempts) {
          console.warn('Payment status check timeout after maximum attempts');
          return false;
        }
        // Continue polling if payment is still pending
        return this.order?.payment_status === 'PENDING';
      }, true)
    ).subscribe({
      error: (err) => {
        console.error('Error checking payment status:', err);
        this.pollingSubscription.unsubscribe();
      }
    });
  }

  download(id: number) {
    this.store.dispatch(new DownloadInvoice({ order_number: id }))
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

}
