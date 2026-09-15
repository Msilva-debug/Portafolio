# Portafolio

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.3.

## Dos experiencias

El selector del navbar alterna entre el portafolio **Profesional** y el **Divertido**. La primera visita abre el profesional y el navegador recuerda la última selección cuando no se indica un modo en la URL.

- `/?modo=profesional`: enlace directo a la presentación profesional.
- `/?modo=divertido`: enlace directo al patio de juegos creativo.

Ambas vistas comparten proyectos, certificaciones, foto, CV y contacto. Los datos se cargan una vez desde `PortfolioProjectsService`; cada presentación tiene su propio componente en `src/app/professional-portfolio/` y `src/app/playful-portfolio/`. Los estilos de la experiencia divertida están delimitados por `.playful-portfolio` en `src/playful-portfolio.css`.

Los cuatro carruseles usan `PortfolioCarouselComponent`, ubicado en `src/app/portfolio-carousel/`. El componente recibe la colección, velocidad, variante visual y una plantilla proyectada; centraliza el bucle infinito, autoplay, rueda, arrastre táctil, centrado y pausa contextual sin acoplarse al diseño de las tarjetas.

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
npm run build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
npm test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
