# Update tsconfig.json
cat << 'EOF' > /Users/sand/GitHub/webseriously/tsconfig.json
{
    "compilerOptions": {
        "strict": true,
        "target": "ES2022",
        "jsx": "preserve",
        "sourceMap": true,
        "outDir": "./dist",
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "esModuleInterop": true,
        "strictNullChecks": true,
        "allowJs": true,
        "checkJs": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "skipLibCheck": true,
        "baseUrl": ".",
        "paths": {
            "*": ["app/*", "plugin/*"]
        },
        "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*"],
    "exclude": ["dist", "aside", "bubble", "node_modules"]
}
EOF

# Update jest.config.cjs
cat << 'EOF' > /Users/sand/GitHub/webseriously/jest.config.cjs
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
EOF