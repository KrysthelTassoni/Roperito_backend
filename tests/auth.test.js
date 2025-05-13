import request from "supertest";
import app from "../app.js"; // Asegúrate de exportar `app` en vez de usar `app.listen()` directamente
import pool from "../config/db.js";

describe("Auth Endpoints", () => {
  beforeAll(async () => {
    // Limpiar la tabla de usuarios antes de las pruebas
    await pool.query("DELETE FROM users WHERE email = $1", [
      "test@example.com",
    ]);
  });

  afterAll(async () => {
    // Limpiar después de las pruebas
    await pool.query("DELETE FROM users WHERE email = $1", [
      "test@example.com",
    ]);
    await pool.end();
  });

  describe("POST /api/auth/register", () => {
    it("debería registrar un nuevo usuario", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        phone: "1234567890",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.email).toBe("test@example.com");
    });

    it("debería rechazar un email duplicado", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User 2",
        email: "test@example.com",
        password: "password123",
        phone: "1234567890",
      });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty("error", "Email ya registrado");
    });
  });

  describe("POST /api/auth/login", () => {
    it("debería hacer login con credenciales correctas", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.email).toBe("test@example.com");
    });

    it("debería rechazar credenciales incorrectas", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Credenciales inválidas");
    });
  });
});
