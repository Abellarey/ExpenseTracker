import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../services/error.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css',
})
export class ProfilePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  readonly currentUser = this.auth.currentUser;
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly profileError = signal('');
  readonly passwordError = signal('');

  readonly profileForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });

  readonly passwordForm = new FormGroup({
    currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6), Validators.maxLength(128)] }),
  });

  ngOnInit(): void {
    const user = this.currentUser();
    if (user) this.profileForm.patchValue({ name: user.name, email: user.email });

    this.auth.restoreSession().subscribe((refreshed) => {
      if (refreshed) this.profileForm.patchValue({ name: refreshed.name, email: refreshed.email });
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);
    this.profileError.set('');

    this.auth.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: (response) => {
        this.notifications.success(response.message);
        this.savingProfile.set(false);
      },
      error: (error: unknown) => {
        this.profileError.set(getErrorMessage(error, 'Unable to update your profile.'));
        this.savingProfile.set(false);
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword.set(true);
    this.passwordError.set('');

    this.auth.changePassword(this.passwordForm.getRawValue()).subscribe({
      next: (response) => {
        this.notifications.success(response.message);
        this.passwordForm.reset({ currentPassword: '', newPassword: '' });
        this.savingPassword.set(false);
      },
      error: (error: unknown) => {
        this.passwordError.set(getErrorMessage(error, 'Unable to change your password.'));
        this.savingPassword.set(false);
      },
    });
  }
}
