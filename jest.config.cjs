module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json'],
  verbose: true,
  testMatch: ['**/*.test.js', '**/*.test.mjs'],
  transform: { '^.+\\.js$': ['babel-jest', { presets: ['@babel/preset-env'] }] },
}; 