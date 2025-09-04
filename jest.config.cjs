module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [
    '**/src/lib/ts/tests/*.[jt]s?(x)',
    '**/src/lib/ts/tests/**/*.[jt]s?(x)'  // Add this line to catch subdirectories
  ],
  bail: 0, // Continue running all tests even if some fail
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.svelte$': ['svelte-jester', { preprocess: true }]
  },
  moduleFileExtensions: ['js', 'ts', 'svelte'],
  moduleNameMapper: {
    '^svelte$': 'svelte/internal',
    '^svelte/store$': 'svelte/store'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(svelte|@sveltejs)/)'
  ]
};
