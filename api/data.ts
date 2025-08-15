import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import dadosGenericos from '../src/models/dados.genericos';

const MONGO_URI = process.env.MONGO_URI as string;

export default async function handler(req: VercelRequest, res: VercelResponse) {


  if (!mongoose.connection.readyState) {
    await mongoose.connect(MONGO_URI);
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'GET') {
    try {

      const page = parseInt(req.query.page as string) || 1;
      let limit = parseInt(req.query.limit as string) || 20;
      if (limit > 100) {
        limit = 100;
      }
      const skip = (page - 1) * limit;

      const filter: { [key: string]: any } = {};
      for (const key in req.query) {
        if (key === 'page' || key === 'limit') continue; // Ignora os parâmetros de paginação

        const value = req.query[key] as string;
        if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
          filter[key] = Number(value);
        } else {
          filter[key] = { $regex: new RegExp(`^${value}$`, 'i') };
        }
      }

      const [data, totalItems] = await Promise.all([
        // Consulta para buscar os dados da página atual
        dadosGenericos.find(filter)
          .limit(limit)
          .skip(skip),
        // Consulta para contar o total de itens que correspondem ao filtro
        dadosGenericos.countDocuments(filter)
      ]);

      res.status(200).json({
        data,
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
          itemsPerPage: limit
        }
      });

    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}