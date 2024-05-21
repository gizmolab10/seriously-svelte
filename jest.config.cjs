module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/src/lib/ts/tests/*.[jt]s?(x)'],
  bail: 0, // Continue running all tests even if some fail
};
