import pool from "../config/db.js";

const addressController = {
  // Obtener perfil del usuario actual

  getRegions: async (req, res) => {
    try {
      const response = await fetch("https://apis.digital.gob.cl/dpa/regiones");
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error("Error obteniendo datos de regiones:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  getProvinces: async (req, res) => {
    try {
      const response = await fetch(
        "https://apis.digital.gob.cl/dpa/provincias"
      );
      let data = await response.json();

      const { regionCode } = req.query; // ejemplo: ?regionCode=01

      if (regionCode) {
        data = data.filter(
          (provincia) => provincia.codigo_padre === regionCode
        );
      }

      res.status(200).json(data);
    } catch (error) {
      console.error("Error obteniendo datos de provincias:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  getCities: async (req, res) => {
    try {
      const response = await fetch("https://apis.digital.gob.cl/dpa/comunas");
      let data = await response.json();

      const { provinceCode } = req.query; // ejemplo: ?provinceCode=056

      if (provinceCode) {
        data = data.filter((comuna) => comuna.codigo_padre === provinceCode);
      }

      res.status(200).json(data);
    } catch (error) {
      console.error("Error obteniendo datos de comunas:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },

  getCodeByName: async (req, res) => {
    try {
      const { type, name } = req.query;

      if (!type || !name) {
        return res
          .status(400)
          .json({ message: "Faltan parámetros: type y name son requeridos." });
      }

      let url = "";
      switch (type) {
        case "region":
          url = "https://apis.digital.gob.cl/dpa/regiones";
          break;
        case "province":
          url = "https://apis.digital.gob.cl/dpa/provincias";
          break;
        case "city":
          url = "https://apis.digital.gob.cl/dpa/comunas";
          break;
        default:
          return res.status(400).json({
            message: "Tipo inválido. Usa 'region', 'province' o 'city'.",
          });
      }

      const response = await fetch(url);
      const data = await response.json();

      const match = data.find(
        (item) => item.nombre.toLowerCase() === name.toLowerCase()
      );

      if (!match) {
        return res.status(404).json({ message: "Nombre no encontrado." });
      }

      return res.status(200).json({ codigo: match.codigo });
    } catch (error) {
      console.error("Error buscando código por nombre:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  },
};

export default addressController;
