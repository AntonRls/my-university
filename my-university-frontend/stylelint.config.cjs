module.exports = {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-prettier-scss'],
  rules: {
    'no-empty-source': null,
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9_-]*$',
      {
        message: 'Expected class name to be camelCase or kebab-case',
      },
    ],
    'scss/load-partial-extension': 'never',
    'scss/load-no-partial-leading-underscore': true,
    'scss/dollar-variable-pattern': '^[a-z][a-zA-Z0-9_-]*$',
    'scss/percent-placeholder-pattern': '^[a-z][a-zA-Z0-9_-]*$',
    'scss/at-function-pattern': '^[a-z][a-zA-Z0-9_-]*$',
    'scss/at-mixin-pattern': '^[a-z][a-zA-Z0-9_-]*$',
    'declaration-empty-line-before': [
      'always',
      {
        except: ['after-declaration', 'first-nested'],
        ignore: ['after-comment', 'inside-single-line-block'],
      },
    ],
    'custom-property-pattern': '^[a-z][a-zA-Z0-9_-]*$',
    'function-name-case': 'lower',
    'property-no-unknown': [
      true,
      {
        ignoreProperties: ['composes', 'compose-with'],
      },
    ],
    'value-keyword-case': 'lower',
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global'],
      },
    ],
    'scss/at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen'],
      },
    ],
  },
  ignoreFiles: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx', 'node_modules/**', 'dist/**'],
};
