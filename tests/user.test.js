import request from "supertest";
import app from "../app.js"; // Asegúrate de exportar `app` en vez de usar `app.listen()` directamente
import pool from "../config/db.js";

// Datos de prueba
const testUser = {
  email: "user1@gmail.com",
  password: "123456",
};

describe("GET /api/users/me", () => {
  let token;

  // Crear un usuario antes de las pruebas (o asumir que ya existe)
  beforeAll(async () => {
    // Asegúrate de tener un usuario creado previamente en la DB con estas credenciales
    const response = await request(app).post("/api/auth/login").send(testUser);

    expect(response.statusCode).toBe(200);
    token = response.body.token;
  });

  it("debería rechazar si no se proporciona token", async () => {
    const res = await request(app).get("/api/users/me");

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("debería retornar el perfil del usuario con token válido", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body).toHaveProperty("products");
    expect(res.body).toHaveProperty("favorites");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("email", testUser.email);
  });

  afterAll(async () => {
    await pool.end(); // Cierra la conexión a la DB
  });
});
