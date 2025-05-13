import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

describe('Database Connection Test', () => {
  let client;

  beforeAll(async () => {
    client = new pg.Client({
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_DATABASE || 'roperito',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    });
  });

  test('should connect to database', async () => {
    try {
      await client.connect();
      expect(client._connected).toBe(true);
    } catch (error) {
      console.error('Error de conexión:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (client) {
      await client.end();
    }
  });
}); 