import pool from "../config/db.js";

const metadataController = {
  // Obtener todas las categorías
  getCategories: async (req, res) => {
    try {
      const query = `
            SELECT 
                c.*,
                COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id
            ORDER BY c.name ASC
        `;

      const result = await pool.query(query);

      res.json({
        categories: result.rows,
      });
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      res.status(500).json({ error: "Error al obtener categorías" });
    }
  },

  // Obtener todas las tallas
  getSizes: async (req, res) => {
    try {
      const { category_id } = req.query;
      let query = `
            SELECT 
                s.*,
                COUNT(p.id) as product_count
            FROM sizes s
            LEFT JOIN products p ON s.id = p.size_id
        `;

      const queryParams = [];
      if (category_id) {
        query += " WHERE p.category_id = $1";
        queryParams.push(category_id);
      }

      query += `
            GROUP BY s.id
            ORDER BY s.name ASC
        `;

      const result = await pool.query(query, queryParams);

      res.json({
        sizes: result.rows,
      });
    } catch (error) {
      console.error("Error al obtener tallas:", error);
      res.status(500).json({ error: "Error al obtener tallas" });
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
