import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { CustomValidators } from '../../../shared/validator/password-match';
import { Register } from '../../../shared/action/auth.action';
import { Breadcrumb } from '../../../shared/interface/breadcrumb';
import { SettingState } from '../../../shared/state/setting.state';
import { ThemeOptionState } from '../../../shared/state/theme-option.state';
import { Option } from '../../../shared/interface/theme-option.interface';
import { Values } from '../../../shared/interface/setting.interface';
import * as data from '../../../shared/data/country-code';
import { NotificationService } from '../../../shared/services/notification.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  @Select(SettingState.setting) setting$: Observable<Values>;
  @Select(ThemeOptionState.themeOptions) themeOption$: Observable<Option>;

  public form: FormGroup;
  public breadcrumb: Breadcrumb = {
    title: "Sign In",
    items: [{ label: 'Sign In', active: true }]
  }
  public codes = data.countryCodes;
  public tnc = new FormControl(false, [Validators.requiredTrue]);
  public reCaptcha: boolean = true;
  public isLoading: boolean = false;


  constructor(
    private store: Store,
    private router: Router,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.form = this.formBuilder.group({
      name: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z\s]*$/)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]*$/)]),
      country_code: new FormControl('91', [Validators.required]),
      password: new FormControl('', [Validators.required]),
      password_confirmation: new FormControl('', [Validators.required]),
      recaptcha: new FormControl(null, Validators.required)
    }, { validator: CustomValidators.MatchValidator('password', 'password_confirmation') });

    this.setting$.subscribe(seting => {
      if ((seting?.google_reCaptcha && !seting?.google_reCaptcha?.status) || !seting?.google_reCaptcha) {
        this.form.removeControl('recaptcha');
        this.reCaptcha = false;
      } else {
        this.form.setControl('recaptcha', new FormControl(null, Validators.required))
        this.reCaptcha = true;
      }
    });

    this.form.get('country_code')?.disable();
    this.form.controls['phone']?.valueChanges.subscribe((value) => {
      // Keep phone as a string (avoid numeric coercion that can break typing/leading zeros)
      const str = value == null ? '' : String(value);
      if (str.length > 10) {
        this.form.controls['phone']?.setValue(str.slice(0, 10), { emitEvent: false });
        return;
      }

      // Custom "must be 10 digits" error, but don't force-touch while the user is typing
      if (str.length > 0 && str.length < 10) {
        this.form.controls['phone'].setErrors({ ...(this.form.controls['phone'].errors || {}), invalid: true });
      } else if (str.length === 10) {
        const errors = { ...(this.form.controls['phone'].errors || {}) };
        delete errors['invalid'];
        this.form.controls['phone'].setErrors(Object.keys(errors).length ? errors : null);
      }
    });

  }

  get passwordMatchError() {
    return (
      this.form.getError('mismatch') &&
      this.form.get('password_confirmation')?.touched
    );
  }

  // Allow only letters and spaces in name field (block numbers/special characters)
  allowOnlyLetters(event: KeyboardEvent): void {
    const allowedControlKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'
    ];
    if (allowedControlKeys.includes(event.key)) return;
    // Allow Ctrl/Cmd combinations (copy, paste, cut, select all)
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
      this.form.controls['name'].setValue(sanitized, { emitEvent: false });
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
      // Move cursor after inserted text
      const nextPos = start + sanitized.length;
      input.setSelectionRange(nextPos, nextPos);
      this.form.controls['name'].setValue(input.value, { emitEvent: false });
    }
  }

  // Allow only digits in phone field (block alphabets/special characters)
  allowOnlyDigits(event: KeyboardEvent): void {
    const allowedControlKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'
    ];
    if (allowedControlKeys.includes(event.key)) return;
    // Allow Ctrl/Cmd combinations (copy, paste, select all)
    if (event.ctrlKey || event.metaKey) return;
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizePhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = (input.value || '').replace(/\D/g, '').slice(0, 10);
    if (digitsOnly !== input.value) {
      input.value = digitsOnly;
      this.form.controls['phone'].setValue(digitsOnly, { emitEvent: false });
    }
  }

  sanitizePhonePaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (/\D/.test(pasted)) {
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
      this.form.controls['phone'].setValue(next, { emitEvent: false });
    }
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.tnc.invalid) {
      return
    }
    if (this.form.valid) {
      this.isLoading = true;
      const payload = { ...this.form.value, 'store-id': environment.storeId };
      this.store.dispatch(new Register(payload)).subscribe({
        complete: () => {
          this.isLoading = false;
          this.router.navigateByUrl('/account/dashboard');
        },
        error: () => {
          this.isLoading = false;
        }
      }
      );
    }
  }
}
