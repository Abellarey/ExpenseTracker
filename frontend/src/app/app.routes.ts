import { Routes } from '@angular/router';
import { MainLayoutComponent } from './components/layout/main-layout.component';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((module) => module.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.page').then((module) => module.RegisterPage),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then((module) => module.DashboardPage),
      },
      {
        path: 'expenses',
        loadComponent: () => import('./pages/expense-list/expense-list.page').then((module) => module.ExpenseListPage),
      },
      {
        path: 'expenses/new',
        loadComponent: () => import('./pages/expense-form/expense-form.page').then((module) => module.ExpenseFormPage),
      },
      {
        path: 'expenses/:id/edit',
        loadComponent: () => import('./pages/expense-form/expense-form.page').then((module) => module.ExpenseFormPage),
      },
      {
        path: 'income',
        loadComponent: () => import('./pages/income/income.page').then((module) => module.IncomePage),
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/categories/categories.page').then((module) => module.CategoriesPage),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.page').then((module) => module.ReportsPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then((module) => module.ProfilePage),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.page').then((module) => module.NotFoundPage),
  },
];
