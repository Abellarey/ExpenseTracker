import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="not-found">
      <div class="code">404</div>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or has moved.</p>
      <a class="btn btn-success" routerLink="/dashboard">Go to dashboard</a>
    </div>
  `,
  styles: [
    `
      .not-found {
        min-height: 70vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .code {
        font-size: 5rem;
        font-weight: 800;
        color: var(--accent);
        line-height: 1;
      }
      p {
        color: var(--muted-text);
        margin-bottom: 1.5rem;
      }
    `,
  ],
})
export class NotFoundPage {}
