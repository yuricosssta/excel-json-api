import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import dadosGenericos from '../src/models/dados.genericos';

const MONGO_URI = process.env.MONGO_URI as string;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(MONGO_URI);
  }

  if (req.method === 'GET') {
    try {
      const filter: { [key: string]: any } = {};
      for (const key in req.query) {
        const value = req.query[key] as string;
        if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
          filter[key] = Number(value);
        } else {
          filter[key] = { $regex: new RegExp(`^${value}$`, 'i') };
        }
      }
      const data = await dadosGenericos.find(filter);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar dados.' });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}