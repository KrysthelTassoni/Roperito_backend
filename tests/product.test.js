import request from "supertest";
import app from "../app.js";
import pool from "../config/db.js";

describe("GET /api/users/products", () => {
  let token;

  // Crear un usuario antes de las pruebas (o asumir que ya existe)
  beforeAll(async () => {
    // Asegúrate de tener un usuario creado previamente en la DB con estas credenciales
    const response = await request(app).post("/api/auth/login").send({
      email: "user1@gmail.com",
      password: "123456",
    });

    expect(response.statusCode).toBe(200);
    token = response.body.token;
  });

  it("debería rechazar si no se proporciona token (401)", async () => {
    const res = await request(app).get("/api/users/products");

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("debería devolver los productos del usuario con token válido (200)", async () => {
    const res = await request(app)
      .get("/api/users/products")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true); // Verifica que la respuesta sea un array
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("id"); // Asegúrate de que los productos tienen la propiedad id
      expect(res.body[0]).toHaveProperty("title"); // Cambié 'name' por 'title'
    }
  });

  afterAll(async () => {
    await pool.end(); // Cierra la conexión a la DB
  });
});
