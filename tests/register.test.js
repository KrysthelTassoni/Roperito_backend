import request from "supertest";
import app from "../app.js";
import pool from "../config/db.js";

describe("POST /register", () => {
  const endpoint = "/api/auth/register";

  beforeAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE 'testuser%@mail.com'");
    await pool.query("DELETE FROM users WHERE email = 'duplicado@mail.com'");
  });

  it("debería registrar un usuario correctamente (201)", async () => {
    const res = await request(app)
      .post(endpoint)
      .send({
        name: "Test User",
        email: `testuser${Date.now()}@mail.com`,
        password: "12345678",
        phone: "+56912345678",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("email");
  });

  it("debería fallar si el email ya está registrado (409)", async () => {
    const email = `duplicado@mail.com`;

    await pool.query(
      `INSERT INTO users (id, name, email, password_hash) VALUES (gen_random_uuid(), 'Duplicado', $1, 'hash')`,
      [email]
    );

    const res = await request(app).post(endpoint).send({
      name: "Otro Usuario",
      email,
      password: "abcdefg",
    });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty("error", "Email ya registrado");
  });

  it("debería fallar si el email es inválido (400)", async () => {
    const res = await request(app).post(endpoint).send({
      name: "Test User",
      email: "no-es-email",
      password: "123456",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Error de validación");
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "email" })])
    );
  });

  it("debería fallar si falta el nombre (400)", async () => {
    const res = await request(app).post(endpoint).send({
      email: "test@email.com",
      password: "12345678",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "name" })])
    );
  });

  it("debería fallar si la contraseña es muy corta (400)", async () => {
    const res = await request(app).post(endpoint).send({
      name: "Usuario",
      email: "shortpass@mail.com",
      password: "123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "password" })])
    );
  });

  afterAll(async () => {
    await pool.end(); // <- Esto cierra correctamente la conexión a PostgreSQL
  });
});
