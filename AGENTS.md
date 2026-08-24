# Repository Guidelines

## Project Structure & Module Organization

This repository contains an Angular portfolio app inside `Portafolio/`. Application source lives in `Portafolio/src/`, with the root component in `Portafolio/src/app/`. Global styles are in `Portafolio/src/styles.css`, static assets are served from `Portafolio/public/`, and Angular configuration is in `Portafolio/angular.json`. The S3 deployment script is `Portafolio/scripts/deploy-s3.sh`.

## Build, Test, and Development Commands

Run commands from `Portafolio/`.

```bash
npm start
```

Starts the Angular dev server.

```bash
npm run build
```

Builds the production app into `dist/Portafolio/browser`.

```bash
npm test
```

Runs Angular unit tests with Karma/Jasmine.

```bash
npm run deploy:s3
```

Builds the Angular app and syncs `dist/Portafolio/browser` to the configured S3 bucket.

## Coding Style & Naming Conventions

Use TypeScript and Angular standalone component conventions. Keep component logic in `*.ts`, templates in `*.html`, and global layout/theme styles in `src/styles.css`. Use 2-space indentation for JSON and TypeScript. Prefer descriptive names such as `profileImage`, `projects`, and `copyEmail`. Avoid inline styles in templates; create semantic CSS classes instead.

## Testing Guidelines

Unit tests use Jasmine and Karma. Place component tests next to the component as `*.spec.ts`, for example `src/app/app.spec.ts`. At minimum, verify component creation and important rendered content or user interactions. Run `npm test` before merging UI or logic changes.

## Commit & Pull Request Guidelines

Recent commits use Spanish, imperative-style summaries, for example `Se implementa portafolio Angular con diseño full stack`. Keep commit titles concise and describe the main user-facing change. Pull requests should include a short description, screenshots for visual changes, verification commands run, and notes about AWS deployment changes.

## Security & Configuration Tips

Never commit `.env`; it is ignored and may contain AWS credentials. Use `.env.example` for safe variable names only. The S3 deployment flow expects `AWS_DEFAULT_REGION`, `AWS_S3_REGION`, and `AWS_S3_BUCKET`. Rotate AWS keys if they are ever shared outside the local machine.
