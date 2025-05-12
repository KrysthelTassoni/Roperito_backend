import pool from "../config/db.js";

const metadataController = {
  // Obtener todas las categorías
  getCategories: async (req, res) => {
    try {
      const query = `SELECT * FROM categories ORDER BY name ASC`;
      const result = await pool.query(query);
      res.json({ categories: result.rows });
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      res.status(500).json({ error: "Error al obtener categorías" });
    }
  },

  // Obtener todas las tallas
  getSizes: async (req, res) => {
    try {
      const query = `SELECT * FROM sizes ORDER BY name ASC`;
      const result = await pool.query(query);
      res.json({ size: result.rows });
    } catch (error) {
      console.error("Error al obtener size:", error);
      res.status(500).json({ error: "Error al obtener size" });
    }
  },

  // Obtener filtros disponibles para búsqueda de productos
  getFilters: async (req, res) => {
    try {
      const [categories, sizes] = await Promise.all([
        pool.query(`
                    SELECT id, name
                    FROM categories
                    ORDER BY name ASC
                `),
        pool.query(`
                    SELECT id, name
                    FROM sizes
                    ORDER BY name ASC
                `),
      ]);

      res.json({
        categories: categories.rows,
        sizes: sizes.rows,
        priceRanges: [
          { min: 0, max: 1000, label: "Hasta $1,000" },
          { min: 1000, max: 5000, label: "$1,000 - $5,000" },
          { min: 5000, max: 10000, label: "$5,000 - $10,000" },
          { min: 10000, max: null, label: "Más de $10,000" },
        ],
      });
    } catch (error) {
      console.error("Error al obtener filtros:", error);
      res.status(500).json({ error: "Error al obtener filtros" });
    }
  },
};

export default metadataController;
