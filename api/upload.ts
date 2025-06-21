
import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import dadosGenericos from '../src/models/dados.genericos';

const MONGO_URI = process.env.MONGO_URI as string;

export default async function handler(req: VercelRequest, res: VercelResponse) {


  if (!mongoose.connection.readyState) {
    await mongoose.connect(MONGO_URI);
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'POST') {
    try {
      // Espera receber { file: <base64 string> }
      const { file } = req.body as { file?: string };
      if (!file) {
        res.status(400).json({ error: 'Arquivo não enviado.' });
        return;
      }

      const buffer = Buffer.from(file, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        res.status(400).json({ error: 'Planilha vazia ou corrompida.' });
        return;
      }
      const worksheet = workbook.Sheets[sheetName];
      let jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        res.status(400).json({ error: 'Nenhum dado encontrado na planilha.' });
        return;
      }

      const result = await dadosGenericos.insertMany(jsonData);

      res.status(201).json({
        message: 'Dados importados e salvos com sucesso!',
        count: result.length,
        data: result,
      });
    } catch (error) {
      console.error('Erro ao processar e salvar o arquivo:', error);
      res.status(500).json({ error: 'Ocorreu um erro interno ao processar e salvar os dados.' });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}