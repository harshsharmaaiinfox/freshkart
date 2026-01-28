import { Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { FormBuilder, FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { Select2Data, Select2UpdateEvent } from 'ng-select2-component';
import { Router } from '@angular/router';
import { Observable, Subscription, map, of } from 'rxjs';
import { Breadcrumb } from '../../../shared/interface/breadcrumb';
import { AccountUser } from "../../../shared/interface/account.interface";
import { AccountState } from '../../../shared/state/account.state';
import { CartState } from '../../../shared/state/cart.state';
import { OrderState } from '../../../shared/state/order.state';
import { Checkout, PlaceOrder } from '../../../shared/action/order.action';
import { ClearCart } from '../../../shared/action/cart.action';
import { AddressModalComponent } from '../../../shared/components/widgets/modal/address-modal/address-modal.component';
import { Cart } from '../../../shared/interface/cart.interface';
import { SettingState } from '../../../shared/state/setting.state';
import { OrderCheckout } from '../../../shared/interface/order.interface';
import { Values, DeliveryBlock } from '../../../shared/interface/setting.interface';
import { CartService } from '../../../shared/services/cart.service';
import { CountryState } from '../../../shared/state/country.state';
import { StateState } from '../../../shared/state/state.state';
import { AuthState } from '../../../shared/state/auth.state';
import * as data from '../../../shared/data/country-code';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer } from '@angular/platform-browser';
import { interval } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, switchMap, takeWhile, tap } from 'rxjs/operators';
import { OrderService } from '../../../shared/services/order.service';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../../../shared/services/auth.service';
// import { PaymentInitModal } from 'pg-test-project';
// import * as React from 'react';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent {

  public breadcrumb: Breadcrumb = {
    title: "Checkout",
    items: [{ label: 'Checkout', active: true }]
  }

  @Select(AccountState.user) user$: Observable<AccountUser>;
  @Select(AuthState.accessToken) accessToken$: Observable<string>;
  @Select(CartState.cartItems) cartItem$: Observable<Cart[]>;
  @Select(OrderState.checkout) checkout$: Observable<OrderCheckout>;
  @Select(SettingState.setting) setting$: Observable<Values>;
  @Select(CartState.cartHasDigital) cartDigital$: Observable<boolean | number>;
  @Select(CountryState.countries) countries$: Observable<Select2Data>;

  // Local storage for cart items to prevent disappearing
  public localCartItems: Cart[] = [];

  @ViewChild("addressModal") AddressModal: AddressModalComponent;
  @ViewChild('cpn', { static: false }) cpnRef: ElementRef<HTMLInputElement>;
  @ViewChild("payByQRModal") payByQRModal: TemplateRef<any>;

  public form: FormGroup;
  public coupon: boolean = true;
  public couponCode: string;
  public appliedCoupon: boolean = false;
  public couponError: string | null;
  public checkoutTotal: OrderCheckout;
  public loading: boolean = false;

  public shippingStates$: Observable<Select2Data>;
  public billingStates$: Observable<Select2Data>;
  public codes = data.countryCodes;

  public formData!: any;
  public pinCodeAreaOfficeCircleDataJSON: any[] = [];

  private pollingSubscription!: Subscription;
  private pollingInterval = 5000; // Poll every 5 seconds

  storeData: any;
  localUserCheck: any;

  payByNeoKredIntentSaveData: any;
  payByNeoStep = 0;
  payment_method = '';

  // Sub Paisa Config
  // @ViewChild('SubPaisaSdk', { static: true }) containerRef!: ElementRef;
  // formData = {
  //   env: 'stag',
  //   clientCode: 'LPS01',
  //   onToggle:() =>this.render(false) 
  // };
  // reactRoot: any = null;

  constructor(
    private store: Store, private router: Router,
    private formBuilder: FormBuilder, public cartService: CartService,
    private modalService: NgbModal,
    private sanitizer: DomSanitizer,
    private orderService: OrderService,
    private authService: AuthService
  ) {
    // Settings are already loaded in app.component.ts and cached in state
    // No need to call GetSettingOption again here

    this.form = this.formBuilder.group({
      products: this.formBuilder.array([], [Validators.required]),
      shipping_address_id: new FormControl('', [Validators.required]),
      billing_address_id: new FormControl('', [Validators.required]),
      points_amount: new FormControl(false),
      wallet_balance: new FormControl(false),
      coupon: new FormControl(),
      delivery_description: new FormControl('', [Validators.required]),
      delivery_interval: new FormControl(),
      payment_method: new FormControl('', [Validators.required]),
      create_account: new FormControl(false),
      name: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z\s]*$/)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      country_code: new FormControl('91', [Validators.required]),
      phone: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]),
      password: new FormControl(),
      shipping_address: new FormGroup({
        title: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z\s]*$/)]),
        street: new FormControl('', [Validators.required]),
        city: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z\s]*$/)]),
        phone: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]),
        pincode: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]),
        country_code: new FormControl('91', [Validators.required]),
        country_id: new FormControl('', [Validators.required]),
        state_id: new FormControl('', [Validators.required]),
      }),
      billing_address: new FormGroup({
        same_shipping: new FormControl(false),
        title: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z\s]*$/)]),
        street: new FormControl('', [Validators.required]),
        city: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z\s]*$/)]),
        phone: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]),
        pincode: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]),
        country_code: new FormControl('91', [Validators.required]),
        country_id: new FormControl('', [Validators.required]),
        state_id: new FormControl('', [Validators.required]),
      })
    });

    this.store.selectSnapshot(state => state.setting).setting.activation.guest_checkout = true;

    if (this.store.selectSnapshot(state => state.auth && state.auth.access_token)) {
      this.form.removeControl('create_account');
      this.form.removeControl('name');
      this.form.removeControl('email');
      this.form.removeControl('country_code');
      this.form.removeControl('phone');
      this.form.removeControl('password');
      this.form.removeControl('password_confirmation');
      this.form.removeControl('shipping_address');
      this.form.removeControl('billing_address');

      this.cartDigital$.subscribe(value => {
        if (value == 1) {
          this.form.controls['shipping_address_id'].clearValidators();
          this.form.controls['delivery_description'].clearValidators();
        } else {
          this.form.controls['shipping_address_id'].setValidators([Validators.required]);
          this.form.controls['delivery_description'].setValidators([Validators.required]);
        }
        this.form.controls['shipping_address_id'].updateValueAndValidity();
        this.form.controls['delivery_description'].updateValueAndValidity();
      });

    } else {

      if (this.store.selectSnapshot(state => state.setting).setting.activation.guest_checkout) {
        this.form.removeControl('shipping_address_id');
        this.form.removeControl('billing_address_id');
        this.form.removeControl('points_amount');
        this.form.removeControl('wallet_balance');

        this.form.controls['create_account'].valueChanges.subscribe(value => {
          if (value) {
            this.form.controls['name'].setValidators([Validators.required]);
            this.form.controls['password'].setValidators([Validators.required]);
          } else {
            this.form.controls['name'].clearValidators();
            this.form.controls['password'].clearValidators();
          }
          this.form.controls['name'].updateValueAndValidity();
          this.form.controls['password'].updateValueAndValidity();
        });

        this.form.statusChanges.subscribe(value => {
          if (value == 'VALID') {
            this.checkout();
          }
        });

      }

    }

    this.form.get('billing_address.same_shipping')?.valueChanges.subscribe(value => {
      if (value) {
        this.form.get('billing_address.title')?.setValue(this.form.get('shipping_address.title')?.value);
        this.form.get('billing_address.street')?.setValue(this.form.get('shipping_address.street')?.value);
        this.form.get('billing_address.country_id')?.setValue(this.form.get('shipping_address.country_id')?.value);
        this.form.get('billing_address.state_id')?.setValue(this.form.get('shipping_address.state_id')?.value);
        this.form.get('billing_address.city')?.setValue(this.form.get('shipping_address.city')?.value);
        this.form.get('billing_address.pincode')?.setValue(this.form.get('shipping_address.pincode')?.value);
        this.form.get('billing_address.country_code')?.setValue(this.form.get('shipping_address.country_code')?.value);
        this.form.get('billing_address.phone')?.setValue(this.form.get('shipping_address.phone')?.value);
      } else {
        this.form.get('billing_address.title')?.setValue('');
        this.form.get('billing_address.street')?.setValue('');
        this.form.get('billing_address.country_id')?.setValue('');
        this.form.get('billing_address.state_id')?.setValue('');
        this.form.get('billing_address.city')?.setValue('');
        this.form.get('billing_address.pincode')?.setValue('');
        this.form.get('billing_address.country_code')?.setValue('');
        this.form.get('billing_address.phone')?.setValue('');
      }
    });

    this.cartService.getUpdateQtyClickEvent().subscribe(() => {
      this.products();
      this.checkout();
    });

    // Enforce digits-only + hard 10-digit max (keep as string, avoid numeric coercion)
    this.form.get('phone')?.valueChanges.subscribe((value) => {
      const str = value == null ? '' : String(value);
      const digitsOnly = str.replace(/\D/g, '').slice(0, 10);
      if (digitsOnly !== str) {
        this.form.get('phone')?.setValue(digitsOnly, { emitEvent: false });
      }
    });

    this.form.get('shipping_address.phone')?.valueChanges.subscribe((value) => {
      const str = value == null ? '' : String(value);
      const digitsOnly = str.replace(/\D/g, '').slice(0, 10);
      if (digitsOnly !== str) {
        this.form.get('shipping_address.phone')?.setValue(digitsOnly, { emitEvent: false });
      }
    });

    this.form.get('billing_address.phone')?.valueChanges.subscribe((value) => {
      const str = value == null ? '' : String(value);
      const digitsOnly = str.replace(/\D/g, '').slice(0, 10);
      if (digitsOnly !== str) {
        this.form.get('billing_address.phone')?.setValue(digitsOnly, { emitEvent: false });
      }
    });

    this.localUserCheck = JSON.parse(localStorage.getItem('account') || '');

    // Load pincode → state/city mapping (same source used by address-modal)
    this.authService.fetchAreaPINCodeJSON().subscribe({
      next: (res) => {
        this.pinCodeAreaOfficeCircleDataJSON = (res && res['data']) ? res['data'] : [];
      },
      error: () => {
        this.pinCodeAreaOfficeCircleDataJSON = [];
      }
    });

    // Auto-fill state + city when pincode is entered (guest checkout)
    this.form.get('shipping_address.pincode')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => this.applyPincodeAutofill('shipping', value));

    this.form.get('billing_address.pincode')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => this.applyPincodeAutofill('billing', value));

  }

  private applyPincodeAutofill(type: 'shipping' | 'billing', value: any) {
    const pincode = (value == null ? '' : String(value)).replace(/\D/g, '').slice(0, 6);
    if (pincode.length !== 6 || !this.pinCodeAreaOfficeCircleDataJSON?.length) return;

    const match = this.pinCodeAreaOfficeCircleDataJSON.find((x: any) => String(x.Pincode) === pincode);
    if (!match) return;

    const group = type === 'shipping' ? 'shipping_address' : 'billing_address';

    // Default country to India (356) if not selected yet
    const currentCountry = this.form.get(`${group}.country_id`)?.value;
    const countryId = currentCountry ? Number(currentCountry) : 356;
    if (!currentCountry) {
      this.form.get(`${group}.country_id`)?.setValue(countryId, { emitEvent: false });
      if (type === 'shipping') {
        this.shippingStates$ = this.store.select(StateState.states).pipe(map(filterFn => filterFn(countryId)));
      } else {
        this.billingStates$ = this.store.select(StateState.states).pipe(map(filterFn => filterFn(countryId)));
      }
    }

    // City from dataset (District)
    if (match.District) {
      this.form.get(`${group}.city`)?.setValue(match.District, { emitEvent: false });
    }

    // State by matching label → value
    const stateName = String(match.StateName || '').trim().toLowerCase();
    if (stateName) {
      const states = this.store.selectSnapshot(StateState.states)(countryId) as any[];
      const found = states?.find(s => String(s.label || '').trim().toLowerCase() === stateName);
      if (found?.value) {
        this.form.get(`${group}.state_id`)?.setValue(found.value, { emitEvent: false });
      }
    }
  }

  // Input restrictions (same UX as Register/Contact)
  allowOnlyLetters(event: KeyboardEvent): void {
    const allowedControlKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'
    ];
    if (allowedControlKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (!/^[A-Za-z\s]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = (input.value || '').replace(/[^A-Za-z\s]/g, '');
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.form.get('name')?.setValue(sanitized, { emitEvent: false });
    }
  }

  sanitizeNamePaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (/[^A-Za-z\s]/.test(pasted)) {
      event.preventDefault();
      const sanitized = pasted.replace(/[^A-Za-z\s]/g, '');
      const input = event.target as HTMLInputElement | null;
      if (!input) return;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      input.value = input.value.slice(0, start) + sanitized + input.value.slice(end);
      const nextPos = start + sanitized.length;
      input.setSelectionRange(nextPos, nextPos);
      this.form.get('name')?.setValue(input.value, { emitEvent: false });
    }
  }

  sanitizeTitleInput(event: Event, controlPath: 'shipping_address.title' | 'billing_address.title'): void {
    const input = event.target as HTMLInputElement;
    const sanitized = (input.value || '').replace(/[^A-Za-z\s]/g, '');
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.form.get(controlPath)?.setValue(sanitized, { emitEvent: false });
    }
  }

  sanitizeTitlePaste(event: ClipboardEvent, controlPath: 'shipping_address.title' | 'billing_address.title'): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (/[^A-Za-z\s]/.test(pasted)) {
      event.preventDefault();
      const sanitized = pasted.replace(/[^A-Za-z\s]/g, '');
      const input = event.target as HTMLInputElement | null;
      if (!input) return;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const next = (input.value.slice(0, start) + sanitized + input.value.slice(end)).replace(/[^A-Za-z\s]/g, '');
      input.value = next;
      const nextPos = Math.min(start + sanitized.length, next.length);
      input.setSelectionRange(nextPos, nextPos);
      this.form.get(controlPath)?.setValue(next, { emitEvent: false });
    }
  }

  sanitizeCityInput(event: Event, controlPath: 'shipping_address.city' | 'billing_address.city'): void {
    const input = event.target as HTMLInputElement;
    const sanitized = (input.value || '').replace(/[^A-Za-z\s]/g, '');
    if (sanitized !== input.value) {
      input.value = sanitized;
      this.form.get(controlPath)?.setValue(sanitized, { emitEvent: false });
    }
  }

  sanitizeCityPaste(event: ClipboardEvent, controlPath: 'shipping_address.city' | 'billing_address.city'): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (/[^A-Za-z\s]/.test(pasted)) {
      event.preventDefault();
      const sanitized = pasted.replace(/[^A-Za-z\s]/g, '');
      const input = event.target as HTMLInputElement | null;
      if (!input) return;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const next = (input.value.slice(0, start) + sanitized + input.value.slice(end)).replace(/[^A-Za-z\s]/g, '');
      input.value = next;
      const nextPos = Math.min(start + sanitized.length, next.length);
      input.setSelectionRange(nextPos, nextPos);
      this.form.get(controlPath)?.setValue(next, { emitEvent: false });
    }
  }

  allowOnlyDigits(event: KeyboardEvent): void {
    const allowedControlKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'
    ];
    if (allowedControlKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizePhoneInput(event: Event, controlPath: 'phone' | 'shipping_address.phone' | 'billing_address.phone'): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = (input.value || '').replace(/\D/g, '').slice(0, 10);
    if (digitsOnly !== input.value) {
      input.value = digitsOnly;
      this.form.get(controlPath)?.setValue(digitsOnly, { emitEvent: false });
    }
  }

  sanitizePhonePaste(event: ClipboardEvent, controlPath: 'phone' | 'shipping_address.phone' | 'billing_address.phone'): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (/\D/.test(pasted) || pasted.length > 10) {
      event.preventDefault();
      const sanitized = pasted.replace(/\D/g, '').slice(0, 10);
      const input = event.target as HTMLInputElement | null;
      if (!input) return;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const next = (input.value.slice(0, start) + sanitized + input.value.slice(end)).replace(/\D/g, '').slice(0, 10);
      input.value = next;
      const nextPos = Math.min(start + sanitized.length, next.length);
      input.setSelectionRange(nextPos, nextPos);
      this.form.get(controlPath)?.setValue(next, { emitEvent: false });
    }
  }

  sanitizePincodeInput(event: Event, controlPath: 'shipping_address.pincode' | 'billing_address.pincode'): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = (input.value || '').replace(/\D/g, '').slice(0, 6);
    if (digitsOnly !== input.value) {
      input.value = digitsOnly;
      this.form.get(controlPath)?.setValue(digitsOnly, { emitEvent: false });
    }
  }

  sanitizePincodePaste(event: ClipboardEvent, controlPath: 'shipping_address.pincode' | 'billing_address.pincode'): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (/\D/.test(pasted) || pasted.length > 6) {
      event.preventDefault();
      const sanitized = pasted.replace(/\D/g, '').slice(0, 6);
      const input = event.target as HTMLInputElement | null;
      if (!input) return;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const next = (input.value.slice(0, start) + sanitized + input.value.slice(end)).replace(/\D/g, '').slice(0, 6);
      input.value = next;
      const nextPos = Math.min(start + sanitized.length, next.length);
      input.setSelectionRange(nextPos, nextPos);
      this.form.get(controlPath)?.setValue(next, { emitEvent: false });
    }
  }

  get productControl(): FormArray {
    return this.form.get("products") as FormArray;
  }

  // private render(isOpen: boolean){
  //   this.reactRoot.render(
  //     React.createElement(PaymentInitModal, { ...this.formData as any, isOpen })
  //   )
  // }

  ngOnInit() {
    this.checkout$.subscribe(data => this.checkoutTotal = data);
    // Subscribe to cart items and store locally to prevent disappearing
    this.cartItem$.subscribe(items => {
      if (items && items.length > 0) {
        this.localCartItems = [...items];
      }
    });
    this.products();
  }

  products() {
    this.cartItem$.subscribe(items => {
      this.productControl.clear();
      items.forEach((item: Cart) =>
        this.productControl.push(
          this.formBuilder.group({
            product_id: new FormControl(item?.product_id, [Validators.required]),
            variation_id: new FormControl(item?.variation_id ? item?.variation_id : ''),
            quantity: new FormControl(item?.quantity),
          })
        ));
    });
  }

  selectShippingAddress(id: number) {
    if (id) {
      this.form.controls['shipping_address_id'].setValue(Number(id));
      this.checkout();
    }
  }

  selectBillingAddress(id: number) {
    if (id) {
      this.form.controls['billing_address_id'].setValue(Number(id));
      this.checkout();
    }
  }

  selectDelivery(value: DeliveryBlock) {
    this.form.controls['delivery_description'].setValue(value?.delivery_description);
    this.form.controls['delivery_interval'].setValue(value?.delivery_interval);
    this.checkout();
  }

  selectPaymentMethod(value: string) {
    this.form.controls['payment_method'].setValue(value);
    this.payment_method = value;
    switch (value) {
      case 'neoKred':
        this.checkout(value);
        break;
      case 'sub_paisa':
        this.checkout(value);
        break;
      case 'cash_free':
        this.checkout(value);
        break;
      case 'zyaada_pay':
        this.checkout(value);
        break;
      case 'ease_buzz':
        this.checkout(value);
        break;
      case 'neoKred2':
        this.checkout(value);
        break;
      case 'ORDINOME_nabu':
        this.checkout(value);
        break;
      case 'deluxe_pay_ordinomeevents':
        this.checkout(value);
        break;
      default:
        break;
    }
  }

  // SubPaisa
  initiateSubPaisa(payment_method: string, uuid: any, order_result: any) {
    const userData = localStorage.getItem('account');
    const payload = {
      uuid,
      ...JSON.parse(userData || '').user,
      checkout: this.checkoutTotal
    }
    this.cartService.initiateSubPaisa(
      {
        uuid: payload.uuid,
        email: payload.email,
        total: this.checkoutTotal?.total?.total,
        phone: JSON.parse(userData || '').user.phone,
        name: JSON.parse(userData || '').user.name,
        address: JSON.parse(userData || '').user.address[0].city + ' ' + JSON.parse(userData || '').user.address[0].area
      }
    ).subscribe({
      next: (data) => {
        if (data) {
          this.formData = this.sanitizer.bypassSecurityTrustHtml(data?.data);
          const container = document.getElementById('paymentContainer');

          if (container) {
            container.innerHTML = data.data;
            const form = container.querySelector('form') as HTMLFormElement;

            // Store payment info in session storage
            sessionStorage.setItem('payment_uuid', uuid);
            sessionStorage.setItem('payment_method', payment_method);
            sessionStorage.setItem('payment_action', JSON.stringify(this.form.value));
            localStorage.setItem('order_id', JSON.stringify(order_result.order_number));
            // Submit the form in the current window
            form.target = '_self';
            form.submit();
          }
        }
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  // NeoKred
  initiateNeoKredPaymentIntent(payment_method: string, uuid: any, order_result: any) {
    const userData = localStorage.getItem('account');
    const parsedUserData = JSON.parse(userData || '{}')?.user || {};

    const payload = {
      uuid,
      ...parsedUserData,
      checkout: this.checkoutTotal
    };

    this.cartService.initiateNeoKredIntent({
      uuid: payload.uuid,
      email: payload.email,
      total: this.checkoutTotal?.total?.total,
      phone: parsedUserData.phone,
      name: parsedUserData.name,
      address: `${parsedUserData.address?.[0]?.city || ''} ${parsedUserData.address?.[0]?.area || ''}`
    }).subscribe({
      next: (response) => {
        if (response?.R && response?.data) {
          try {
            const cashFreeData = response.data;

            if (cashFreeData?.payment_url) {
              // Store payment info in session storage
              sessionStorage.setItem('payment_uuid', uuid);
              sessionStorage.setItem('payment_method', payment_method);
              sessionStorage.setItem('payment_action', JSON.stringify(this.form.value));
              localStorage.setItem('order_id', JSON.stringify(order_result.order_number));
              // Open in current tab
              window.location.href = cashFreeData.payment_url;
            } else {
              console.error("Invalid response: Payment link is missing.");
            }
          } catch (error) {
            console.error("Error parsing CashFree response:", error);
          }
        } else {
          console.error("Payment initiation failed:", response?.msg);
        }
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  // Ease Buzz
  initiateEaseBuzzPaymentIntent(payment_method: string, uuid: any, order_result: any) {
    const userData = localStorage.getItem('account');
    const parsedUserData = JSON.parse(userData || '{}')?.user || {};

    const payload = {
      uuid,
      ...parsedUserData,
      checkout: this.checkoutTotal
    };

    this.cartService.initiateEaseBuzzIntent({
      uuid: payload.uuid,
      email: payload.email,
      total: this.checkoutTotal?.total?.total,
      name: parsedUserData.name,
      address: `${parsedUserData.address?.[0]?.city || ''} ${parsedUserData.address?.[0]?.area || ''}`,
      phone: parsedUserData.phone,
    }).subscribe({
      next: (response) => {
        if (response?.R && response?.data) {
          try {
            const easeBuzzData = response.data;

            if (easeBuzzData?.payment_url) {
              // Store payment info in session storage
              sessionStorage.setItem('payment_uuid', uuid);
              sessionStorage.setItem('payment_method', payment_method);
              sessionStorage.setItem('payment_action', JSON.stringify(this.form.value));
              localStorage.setItem('order_id', JSON.stringify(order_result.order_number));
              // Open in current tab
              window.location.href = easeBuzzData.payment_url;
            } else {
              console.error("Invalid response: Payment link is missing.");
            }
          } catch (error) {
            console.error("Error parsing Ease Buzz response:", error);
          }
        } else {
          console.error("Payment initiation failed:", response?.msg);
        }
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  // CashFree Payment Integration
  initiateCashFreePaymentIntent(payment_method: string, uuid: any, order_result: any) {
    const userData = localStorage.getItem('account');
    const parsedUserData = JSON.parse(userData || '{}')?.user || {};

    const payload = {
      uuid,
      ...parsedUserData,
      checkout: this.checkoutTotal
    };

    this.cartService.initiateCashFreeIntent({
      uuid: payload.uuid,
      email: payload.email,
      total: this.checkoutTotal?.total?.total,
      phone: parsedUserData.phone,
      name: parsedUserData.name,
      address: `${parsedUserData.address?.[0]?.city || ''} ${parsedUserData.address?.[0]?.area || ''}`
    }).subscribe({
      next: (response) => {
        if (response?.R && response?.data) {
          try {
            const cashFreeData = response.data;

            if (cashFreeData?.payment_link) {
              // Store payment info in session storage
              localStorage.setItem('payment_uuid', uuid);
              localStorage.setItem('payment_method', payment_method);
              localStorage.setItem('payment_action', JSON.stringify(this.form.value));
              localStorage.setItem('order_id', JSON.stringify(order_result.order_number));
              // Open in current tab
              window.location.href = cashFreeData.payment_link;
            } else {
              console.error("Invalid response: Payment link is missing.");
            }
          } catch (error) {
            console.error("Error parsing CashFree response:", error);
          }
        } else {
          console.error("Payment initiation failed:", response?.msg);
        }
      },
      error: (err) => {
        console.log("Error initiating payment:", err);
      }
    });
  }

  // Zyaada Pay Payment Integration
  initiateZyaadaPayPaymentIntent(payment_method: string, uuid: any, order_result: any) {
    const userData = localStorage.getItem('account');
    const parsedUserData = JSON.parse(userData || '{}')?.user || {};

    const payload = {
      uuid,
      ...parsedUserData,
      checkout: this.checkoutTotal
    };

    this.cartService.initiateZyaadaPayIntent({
      uuid: payload.uuid,
      email: payload.email,
      total: this.checkoutTotal?.total?.total,
      phone: parsedUserData.phone,
      name: parsedUserData.name,
      address: `${parsedUserData.address?.[0]?.city || ''} ${parsedUserData.address?.[0]?.area || ''}`
    }).subscribe({
      next: (response) => {
        if (response?.R && response?.data) {
          try {
            const zyaadaPayData = response.data;

            if (zyaadaPayData?.payment_url) {
              // Store payment info in session storage
              sessionStorage.setItem('payment_uuid', uuid);
              sessionStorage.setItem('payment_method', payment_method);
              sessionStorage.setItem('payment_action', JSON.stringify(this.form.value));
              localStorage.setItem('order_id', JSON.stringify(order_result.order_number));
              // Open in current tab
              window.location.href = zyaadaPayData.payment_url;
            } else {
              console.error("Invalid response: Payment link is missing.");
            }
          } catch (error) {
            console.error("Error parsing Zyaada Pay response:", error);
          }
        } else {
          console.error("Payment initiation failed:", response?.msg);
        }
      },
      error: (err) => {
        console.log("Error initiating payment:", err);
      }
    });
  }

  // NeoKred2
  initiateNeoKred2PaymentIntent(payment_method: string, uuid: any, order_result: any) {
    console.log(payment_method, uuid, order_result);
    const userData = localStorage.getItem('account');
    const parsedUserData = JSON.parse(userData || '{}')?.user || {};

    const payload = {
      uuid,
      ...parsedUserData,
      checkout: this.checkoutTotal
    };

    this.cartService.initiateNeoKred2Intent({
      uuid: payload.uuid,
      email: payload.email,
      total: this.checkoutTotal?.total?.total,
      phone: parsedUserData.phone,
      name: parsedUserData.name,
      address: `${parsedUserData.address?.[0]?.city || ''} ${parsedUserData.address?.[0]?.area || ''}`
    }).subscribe({
      next: (response) => {
        if (response?.R && response?.data) {
          try {
            const zyaadaPayData = response.data;

            if (zyaadaPayData?.payment_url) {
              // Store payment info in session storage
              sessionStorage.setItem('payment_uuid', uuid);
              sessionStorage.setItem('payment_method', payment_method);
              sessionStorage.setItem('payment_action', JSON.stringify(this.form.value));
              localStorage.setItem('order_id', JSON.stringify(order_result.order_number));
              // Open in current tab
              window.location.href = zyaadaPayData.payment_url;
            } else {
              console.error("Invalid response: Payment link is missing.");
            }
          } catch (error) {
            console.error("Error parsing Zyaada Pay response:", error);
          }
        } else {
          console.error("Payment initiation failed:", response?.msg);
        }
      },
      error: (err) => {
        console.log("Error initiating payment:", err);
      }
    });
  }

  // ORDINOME Nabu Payment Integration
  initiateORDINOMENabuPaymentIntent(payment_method: string, uuid: any, order_result: any) {
    const userData = localStorage.getItem('account');
    const parsedUserData = JSON.parse(userData || '{}')?.user || {};

    const payload = {
      uuid,
      ...parsedUserData,
      checkout: this.checkoutTotal
    };

    this.cartService.initiateORDINOMENabuIntent({
      uuid: payload.uuid,
      email: payload.email,
      total: this.checkoutTotal?.total?.total,
      phone: parsedUserData.phone,
      name: parsedUserData.name,
      address: `${parsedUserData.address?.[0]?.city || ''} ${parsedUserData.address?.[0]?.area || ''}`
    }).subscribe({
      next: (resp) => {
        this.pollingSubscription && this.pollingSubscription.unsubscribe();

        let attemptedNavigation = false;
        let paymentWindow: Window | null = null;

        const paymentLink = resp?.payment_link || resp?.url || resp?.data?.payment_url || resp?.data?.payment_link;

        if (paymentLink) {
          sessionStorage.setItem('payment_uuid', uuid);
          sessionStorage.setItem('payment_method', payment_method);
          sessionStorage.setItem('payment_action', JSON.stringify(this.form.value));
          localStorage.setItem('order_id', JSON.stringify(order_result.order_number));

          attemptedNavigation = true;
          window.location.href = paymentLink;
        } else if (typeof resp?.data === 'string') {
          const container = document.getElementById('paymentContainer');
          if (container) {
            container.innerHTML = resp.data;
            setTimeout(() => {
              paymentWindow = window.open('', 'PaymentWindow', 'width=600,height=700,resizable=yes,scrollbars=yes');
              if (paymentWindow) {
                const formHtml = (container.querySelector('form') as HTMLFormElement)?.outerHTML || '';
                paymentWindow.document.write(`<html><body>${formHtml}<script>document.getElementById('submitButton')&&document.getElementById('submitButton').click();<\/script></body></html>`);
                paymentWindow.document.close();
                attemptedNavigation = true;
              }
            }, 500);
          }
        }

        if (attemptedNavigation) {
          this.checkTransactionStatusSleekSynergy(uuid, paymentWindow, payment_method);
        }
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  // DeluxePay Payment Integration
  initiateDeluxePayPaymentIntent(payment_method: string, uuid: any, order_result: any) {
    const userData = localStorage.getItem('account');
    const parsedUserData = JSON.parse(userData || '{}')?.user || {};

    const payload = {
      uuid,
      ...parsedUserData,
      checkout: this.checkoutTotal
    };

    // Prepare payment data with only required fields for DeluxePay API
    // API expects: uuid (string), email (string), total (number), phone (number), name (string), address (string)
    const paymentData: any = {
      uuid: payload.uuid,
      email: payload.email || parsedUserData.email,
      total: this.checkoutTotal?.total?.total,
      phone: parsedUserData.phone,
      name: parsedUserData.name,
      address: `${parsedUserData.address?.[0]?.city || ''} ${parsedUserData.address?.[0]?.area || ''}`.trim()
    };

    // Ensure total is a number (API expects number, not string)
    if (paymentData.total !== undefined && paymentData.total !== null) {
      paymentData.total = typeof paymentData.total === 'string' ? parseFloat(paymentData.total) : Number(paymentData.total);
    }

    // Ensure phone is a number (API expects pure number like 8525000120, not string)
    if (paymentData.phone !== undefined && paymentData.phone !== null && paymentData.phone !== '') {
      // Remove all non-numeric characters and convert to number
      const phoneStr = String(paymentData.phone).replace(/\D/g, '');
      if (phoneStr) {
        paymentData.phone = parseInt(phoneStr, 10);
      } else {
        delete paymentData.phone; // Remove if invalid
      }
    }

    // Remove undefined/null/empty values to avoid "No Data" error
    const cleanedPaymentData: any = {};
    Object.keys(paymentData).forEach(key => {
      const value = paymentData[key];
      // Allow 0 for numbers, but filter out undefined/null/empty strings
      if (value !== undefined && value !== null && value !== '') {
        cleanedPaymentData[key] = value;
      }
    });

    // Log the payload for debugging
    console.log('DeluxePay Payment Request:', cleanedPaymentData);
    console.log('Raw User Data:', parsedUserData);
    console.log('Checkout Total:', this.checkoutTotal);

    // Validate required fields before sending
    if (!cleanedPaymentData.uuid || !cleanedPaymentData.email || !cleanedPaymentData.total) {
      console.error('DeluxePay: Missing required fields', {
        uuid: cleanedPaymentData.uuid,
        email: cleanedPaymentData.email,
        total: cleanedPaymentData.total,
        parsedUserData: parsedUserData,
        checkoutTotal: this.checkoutTotal
      });
      this.loading = false;
      return;
    }

    this.cartService.initiateDeluxePayIntent(cleanedPaymentData).subscribe({
      next: (response) => {
        console.log('DeluxePay Response:', response);
        if (response?.R && response?.data) {
          try {
            // API returns payment URL directly as a string in response.data
            const paymentUrl = typeof response.data === 'string' ? response.data : response.data?.payment_url;

            if (paymentUrl) {
              // Store payment info in session storage
              sessionStorage.setItem('payment_uuid', uuid);
              sessionStorage.setItem('payment_method', payment_method);
              sessionStorage.setItem('payment_action', JSON.stringify(this.form.value));
              sessionStorage.setItem('payment_redirected', 'true'); // Flag to detect back button
              localStorage.setItem('order_id', JSON.stringify(order_result.order_number));
              // Open in current tab
              window.location.href = paymentUrl;
            } else {
              console.error("Invalid response: Payment link is missing.", response);
              this.loading = false;
            }
          } catch (error) {
            console.error("Error parsing DeluxePay response:", error);
            this.loading = false;
          }
        } else {
          console.error("Payment initiation failed:", response?.msg || response);
          this.loading = false;
        }
      },
      error: (err) => {
        console.error("Error initiating DeluxePay payment:", err);
        this.loading = false;
      }
    });
  }

  // Transaction Status Check for ORDINOME Nabu (and other payment gateways)
  checkTransactionStatusSleekSynergy(uuid: any, paymentWindow: Window | null, payment_method: string) {
    this.pollingSubscription = interval(this.pollingInterval).pipe(
      switchMap(() => this.cartService.checkTransectionStatusNeoKred(uuid, payment_method)),
      takeWhile((response: any) => {
        if (response?.status === true) {
          if (paymentWindow) {
            paymentWindow.close();
          }
          const orderId = localStorage.getItem('order_id');
          if (orderId) {
            this.router.navigate(['/account/order/details', JSON.parse(orderId)]);
          }
          this.pollingSubscription.unsubscribe();
          return false;
        }
        return true;
      }, true)
    ).subscribe({
      error: (err) => {
        console.error('Error checking payment status:', err);
        this.pollingSubscription.unsubscribe();
      }
    });
  }

  async openNeoKredModal(data: any) {
    this.payByNeoKredIntentSaveData = data;
    console.log(this.payByNeoKredIntentSaveData);
    this.modalService.open(this.payByQRModal, {
      ariaLabelledBy: 'address-add-Modal',
      centered: true,
      windowClass: 'theme-modal modal-lg address-modal'
    }).result.then((result) => {
      `Result ${result}`
      const formDataContainer = document.getElementById('formDataContainer');
      console.log(formDataContainer);
    }, (reason) => {
      const formDataContainer = document.getElementById('formDataContainer');
      console.log(formDataContainer);
    });
  }

  payByNeoKredIntentSaveDataUpiIntentString(upi: string) {
    switch (upi) {
      case 'gpay_upi':
        return this.payByNeoKredIntentSaveData.upiIntentString.replace("upi://pay?", "tez://pay?");
      case 'phone_pay_upi':
        return this.payByNeoKredIntentSaveData.upiIntentString.replace("upi://pay?", "phonepe://pay?");
      case 'paytm_upi':
        return this.payByNeoKredIntentSaveData.upiIntentString.replace("upi://pay?", "paytmmp://pay?");
      case 'bhim_upi':
        break;
      // return this.payByNeoKredIntentSaveData.upiIntentString.replace()
      default:
        break;
    }

  }

  paybyNeoNext() {
    this.payByNeoStep = 1;
  }

  paybyNeoDone() {
    this.payByNeoStep = 0;
    this.modalService.dismissAll();
    this.pollingSubscription.unsubscribe();
  }


  togglePoint(event: Event) {
    this.form.controls['points_amount'].setValue((<HTMLInputElement>event.target)?.checked);
    this.checkout();
  }

  toggleWallet(event: Event) {
    this.form.controls['wallet_balance'].setValue((<HTMLInputElement>event.target)?.checked);
    this.checkout();
  }

  showCoupon() {
    this.coupon = true;
  }

  setCoupon(value?: string) {
    this.couponError = null;

    if (value)
      this.form.controls['coupon'].setValue(value);
    else
      this.form.controls['coupon'].reset();

    this.store.dispatch(new Checkout(this.form.value)).subscribe({
      error: (err) => {
        this.couponError = err.message;
      },
      complete: () => {
        this.appliedCoupon = value ? true : false;
        this.couponError = null;
      }
    });
  }

  couponRemove() {
    this.setCoupon();
  }

  shippingCountryChange(data: Select2UpdateEvent) {
    if (data && data?.value) {
      this.shippingStates$ = this.store
        .select(StateState.states)
        .pipe(map(filterFn => filterFn(+data?.value)));
    } else {
      this.form.get('shipping_address.state_id')?.setValue('');
      this.shippingStates$ = of();
    }
  }

  billingCountryChange(data: Select2UpdateEvent) {
    if (data && data?.value) {
      this.billingStates$ = this.store
        .select(StateState.states)
        .pipe(map(filterFn => filterFn(+data?.value)));
      if (this.form.get('billing_address.same_shipping')?.value) {
        setTimeout(() => {
          this.form.get('billing_address.state_id')?.setValue(this.form.get('shipping_address.state_id')?.value);
        }, 200);
      }
    } else {
      this.form.get('billing_address.state_id')?.setValue('');
      this.billingStates$ = of();
    }
  }

  checkout(payment_method?: string) {
    // If has coupon error while checkout
    if (this.couponError) {
      this.couponError = null;
      this.cpnRef.nativeElement.value = '';
      this.form.controls['coupon'].reset();
    }

    if (this.form.valid) {
      this.loading = true;
      this.store.dispatch(new Checkout(this.form.value)).subscribe({
        next: (value) => {
          this.storeData = value;
          console.log(this.storeData);
        },
        error: (err) => {
          this.loading = false;
          throw new Error(err);
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      const invalidFields = Object?.keys(this.form?.controls).filter(key => this.form.controls[key].invalid);
    }
  }

  placeorder() {
    // Prevent double submission
    if (this.loading) {
      return;
    }

    if (this.form.valid) {
      if (this.cpnRef && !this.cpnRef.nativeElement.value) {
        this.form.controls['coupon'].reset();
      }

      const uuid = uuidv4();

      const formData = {
        ...this.form.value,
        uuid: uuid
      }

      let action = new PlaceOrder(formData);
      // this.store.dispatch(new PlaceOrder(formData));

      // Set loading state to prevent double submission
      this.loading = true;

      this.orderService.placeOrder(action?.payload).pipe(
        tap({
          next: result => {
            console.log(result);
          },
          error: err => {
            this.loading = false; // Reset loading on error
            throw new Error(err?.error?.message);
          }
        })
      ).subscribe({
        next: (result) => {
          this.store.dispatch(new ClearCart());
          if (this.payment_method === 'cash_free') {
            this.initiateCashFreePaymentIntent(this.payment_method, uuid, result);
          }
          if (this.payment_method === 'sub_paisa') {
            this.initiateSubPaisa(this.payment_method, uuid, result);
          }
          if (this.payment_method === 'neoKred') {
            this.initiateNeoKredPaymentIntent(this.payment_method, uuid, result);
          }
          if (this.payment_method === 'zyaada_pay') {
            this.initiateZyaadaPayPaymentIntent(this.payment_method, uuid, result);
          }
          if (this.payment_method === 'ease_buzz') {
            this.initiateEaseBuzzPaymentIntent(this.payment_method, uuid, result);
          }
          if (this.payment_method === 'neoKred2') {
            this.initiateNeoKred2PaymentIntent(this.payment_method, uuid, result);
          }
          if (this.payment_method === 'ORDINOME_nabu') {
            this.initiateORDINOMENabuPaymentIntent(this.payment_method, uuid, result);
          }
          if (this.payment_method === 'deluxe_pay_ordinomeevents') {
            this.initiateDeluxePayPaymentIntent(this.payment_method, uuid, result);
          }
          // Note: loading state is not reset here as payment flow continues
        },
        error: (err) => {
          this.loading = false; // Reset loading on error
          console.log(err);
        }
      });
    }
  }

  paybyqr() {
    this.modalService.dismissAll();
    // PlaceOrder Here
  }

  clearCart() {
    this.store.dispatch(new ClearCart());
  }

  ngOnDestroy() {
    // this.store.dispatch(new Clear());
    // this.store.dispatch(new ClearCart());
    this.form.reset();
    this.pollingSubscription && this.pollingSubscription.unsubscribe();
  }

}
