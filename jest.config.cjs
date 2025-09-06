/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.ts$': ['ts-jest'],
        '^.+\\.svelte$': ['svelte-jester']
    },
    moduleFileExtensions: ['js', 'ts', 'svelte'],
    testMatch: [
        "**/tests/slim/**/*Test.ts",
        "**/tests/slim/**/*.test.ts"
    ],
    transformIgnorePatterns: [
        "node_modules/(?!(svelte)/)"
    ]
};
