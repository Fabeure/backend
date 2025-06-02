export default () => ({
  port: 3000,
  database: {
    uri: 'mongodb://localhost:27017/emotion-tracker',
  },
  jwt: {
    secret: 'your-secret-key',
    expiresIn: '1d',
  },
});
