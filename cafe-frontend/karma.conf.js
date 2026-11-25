// ============================================================
//  Karma — configuración propia del frontend
//
//  Se usa porque el builder de Angular (@angular/build:karma)
//  fija internamente los reporters de cobertura a html +
//  text-summary, y no expone una opción para agregar lcov.
//  Sin lcov no se puede publicar la cobertura en el CI.
//
//  Además se declara un umbral mínimo (check.global) para que
//  `ng test --code-coverage` falle si la cobertura retrocede.
//
//  Al definir "karmaConfig" en angular.json, el builder deja de
//  usar su configuración interna y usa esta.
// ============================================================

const path = require('path');

module.exports = (config) => {
  config.set({
    frameworks: ['jasmine'],

    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],

    jasmineHtmlReporter: {
      suppressAll: true,
    },

    coverageReporter: {
      dir: path.join(__dirname, 'coverage', 'cafe-frontend'),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }, { type: 'lcov' }],
      // Umbrales por debajo de la cobertura actual (32.5 % statements),
      // para que no fallen hoy pero impidan retroceder.
      check: {
        global: {
          statements: 30,
          lines: 30,
          functions: 10,
        },
      },
    },

    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    restartOnFileChange: true,
  });
};
