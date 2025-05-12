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

  // Obtener todos los colores
  getColors: async (req, res) => {
    try {
      const query = `
                SELECT 
                    c.*,
                    COUNT(p.id) as product_count
                FROM colors c
                LEFT JOIN products p ON c.id = p.color_id AND p.is_active = true
                WHERE c.is_active = true
                GROUP BY c.id
                ORDER BY c.name ASC
            `;

      const result = await pool.query(query);

      res.json({
        colors: result.rows,
      });
    } catch (error) {
      console.error("Error al obtener colores:", error);
      res.status(500).json({ error: "Error al obtener colores" });
    }
  },

  // Obtener filtros disponibles para búsqueda de productos
  getFilters: async (req, res) => {
    try {
      const [categories, brands, sizes, colors, conditions] = await Promise.all(
        [
          pool.query(`
                    SELECT id, name, icon_url
                    FROM categories
                    WHERE is_active = true
                    ORDER BY name ASC
                `),
          pool.query(`
                    SELECT id, name
                    FROM brands
                    WHERE is_active = true
                    ORDER BY name ASC
                `),
          pool.query(`
                    SELECT id, name, order_index
                    FROM sizes
                    WHERE is_active = true
                    ORDER BY order_index ASC
                `),
          pool.query(`
                    SELECT id, name, hex_code
                    FROM colors
                    WHERE is_active = true
                    ORDER BY name ASC
                `),
          pool.query(`
                    SELECT id, name, description
                    FROM conditions
                    WHERE is_active = true
                    ORDER BY order_index ASC
                `),
        ]
      );

      res.json({
        categories: categories.rows,
        brands: brands.rows,
        sizes: sizes.rows,
        colors: colors.rows,
        conditions: conditions.rows,
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

  // Obtener configuración del sistema
  getSystemConfig: async (req, res) => {
    try {
      const query = `
                SELECT 
                    key,
                    value,
                    description,
                    updated_at
                FROM system_config
                WHERE is_active = true
                ORDER BY key ASC
            `;

      const result = await pool.query(query);

      // Convertir a objeto para más fácil acceso
      const config = result.rows.reduce((acc, row) => {
        acc[row.key] = {
          value: row.value,
          description: row.description,
          updated_at: row.updated_at,
        };
        return acc;
      }, {});

      res.json({
        config,
      });
    } catch (error) {
      console.error("Error al obtener configuración del sistema:", error);
      res
        .status(500)
        .json({ error: "Error al obtener configuración del sistema" });
    }
  },
};

export default metadataController;
