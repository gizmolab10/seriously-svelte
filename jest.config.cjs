/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: {
                    moduleResolution: "NodeNext",
                    module: "NodeNext",
                    target: "ES2022"
                }
            }
        ]
    },
    testMatch: [
        "**/tests/slim/**/*Test.ts"
    ]
};
