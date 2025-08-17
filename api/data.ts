// // excel-json-api/api/data.ts
// import type { VercelRequest, VercelResponse } from '@vercel/node';
// import mongoose from 'mongoose';
// import dadosGenericos from '../src/models/dados.genericos';

// const MONGO_URI = process.env.MONGO_URI as string;

// export default async function handler(req: VercelRequest, res: VercelResponse) {


//   if (!mongoose.connection.readyState) {
//     await mongoose.connect(MONGO_URI);
//   }

//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method === 'GET') {
//     try {
//       const filter: { [key: string]: any } = {};
//       for (const key in req.query) {
//         if (Object.prototype.hasOwnProperty.call(req.query, key)) {
//           const value = req.query[key] as string;

//           // Trata valores numéricos
//           if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
//             filter[key] = Number(value);
//           } else {
//             // Para strings, usa uma regex para busca case-insensitive
//             filter[key] = { $regex: new RegExp(`^${value}$`, 'i') };
//           }
//         }
//         // Usa o objeto de filtro para buscar os dados no banco
//         // const data = await DataEntry.find(filter);



//         const page = parseInt(req.query.page as string) || 1;
//         let limit = parseInt(req.query.limit as string) || 20;
//         if (limit > 100) {
//           limit = 100;
//         }
//         const skip = (page - 1) * limit;

//         // Pega o termo de busca genérico 'q' da query string
//         // const searchTerm = req.query.q as string;
//         // if (searchTerm) {
//         //   // Cria uma expressão regular para buscar "contém" (não apenas correspondência exata)
//         //   // A opção 'i' torna a busca case-insensitive (não diferencia maiúsculas de minúsculas)
//         //   const regex = { $regex: searchTerm, $options: 'i' };

//         //   // Procura o termo em qualquer um dos campos listados
//         //   filter.$or = [
//         //     { grupo: regex },
//         //     { descricao: regex },
//         //     // Adicione outros campos de texto que você queira incluir na busca
//         //     { composicao: regex },
//         //     // { insumo: regex },
//         //   ];
//         // }

//         // for (const key in req.query) {
//         //   if (key === 'page' || key === 'limit') continue; // Ignora os parâmetros de paginação

//         //   const value = req.query[key] as string;
//         //   if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
//         //     filter[key] = Number(value);
//         //   } else {
//         //     filter[key] = { $regex: new RegExp(`^${value}$`, 'i') };
//         //   }
//         // }

//         const [data, totalItems] = await Promise.all([
//           // Consulta para buscar os dados da página atual
//           dadosGenericos.find(filter)
//             .limit(limit)
//             .skip(skip),
//           // Consulta para contar o total de itens que correspondem ao filtro
//           dadosGenericos.countDocuments(filter)
//         ]);

//         res.status(200).json({
//           data,
//           pagination: {
//             totalItems,
//             totalPages: Math.ceil(totalItems / limit),
//             currentPage: page,
//             itemsPerPage: limit
//           }
//         });

//       } catch (error) {
//         res.status(500).json({ error: 'Erro ao buscar dados.' });
//       }
//     } else {
//       res.status(405).json({ error: 'Método não permitido' });
//     }
//   }

// api/data.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import dadosGenericos from '../src/models/dados.genericos';

const MONGO_URI = process.env.MONGO_URI as string;

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  try {
    await connectDB();

    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    let limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    const searchTerm = req.query.q as string;
    if (searchTerm) {
      const regex = { $regex: searchTerm, $options: 'i' };
      const num = Number(searchTerm);

      filter.$or = [
        { grupo: regex },
        { descricao: regex },
        { composicao: regex },
        // { insumo: regex },
        ...(isNaN(num) ? [] : [{ composicao: num }])
      ];
    } else {
      Object.entries(req.query).forEach(([key, value]) => {
        if (['page', 'limit'].includes(key)) return;
        const num = Number(value);
        filter[key] = !isNaN(num) ? num : { $regex: new RegExp(`^${value}$`, 'i') };
      });
    }

    const [data, totalItems] = await Promise.all([
      dadosGenericos.find(filter).skip(skip).limit(limit),
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
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados.' });
  }
}
