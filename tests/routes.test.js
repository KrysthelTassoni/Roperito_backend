import request from 'supertest';
import app from '../app.js';
import db from '../config/db.js';

let token;
let productId;

beforeAll(async () => {
  // Registrar y loguear un usuario de prueba para obtener token
  await db.query('DELETE FROM users WHERE email = $1', ['routes_test@example.com']);
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Routes Test',
      email: 'routes_test@example.com',
      password: 'password123',
      phone: '1234567890'
    });
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'routes_test@example.com',
      password: 'password123'
    });
  token = res.body.token;
});

afterAll(async () => {
  await db.query('DELETE FROM users WHERE email = $1', ['routes_test@example.com']);
  await db.pool.end();
});

describe('GET /api/products/:id', () => {
  it('debería devolver 404 si el producto no existe', async () => {
    const res = await request(app).get('/api/products/00000000-0000-0000-0000-000000000000');
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/users/me', () => {
  it('debería rechazar sin token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.statusCode).toBe(401);
  });

  it('debería devolver el perfil del usuario autenticado', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', 'routes_test@example.com');
  });
});

describe('POST /api/orders', () => {
  it('debería rechazar sin token', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({});
    expect(res.statusCode).toBe(401);
  });

  it('debería rechazar datos inválidos', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });
}); 