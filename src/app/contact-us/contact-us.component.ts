import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss'],
  imports: [CommonModule, ReactiveFormsModule] // Import ReactiveFormsModule here
})
export class ContactUsComponent {
  contactForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern('^[A-Za-z ]+$')]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      message: ['', Validators.required]
    });

    // Enforce hard 10-digit max even during typing/paste
    this.contactForm.get('phone')?.valueChanges.subscribe((value) => {
      const str = value == null ? '' : String(value);
      const digitsOnly = str.replace(/\D/g, '').slice(0, 10);
      if (digitsOnly !== str) {
        this.contactForm.get('phone')?.setValue(digitsOnly, { emitEvent: false });
      }
    });
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
      this.contactForm.get('name')?.setValue(sanitized, { emitEvent: false });
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
      this.contactForm.get('name')?.setValue(input.value, { emitEvent: false });
    }
  }

  // Allow only digits in phone field (block alphabets/special characters)
  allowOnlyDigits(event: KeyboardEvent): void {
    const allowedControlKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'
    ];
    if (allowedControlKeys.includes(event.key)) return;
    // Allow Ctrl/Cmd combinations (copy, paste, cut, select all)
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
      this.contactForm.get('phone')?.setValue(digitsOnly, { emitEvent: false });
    }
  }

  sanitizePhonePaste(event: ClipboardEvent): void {
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
      this.contactForm.get('phone')?.setValue(next, { emitEvent: false });
    }
  }

  onSubmit() {
    if (this.contactForm.valid) {
      console.log('Form submitted', this.contactForm.value);
      alert('Form submitted successfully!');
      this.contactForm.reset();
    } else {
      alert('Please fill all fields correctly before submitting.');
    }
  }
}
