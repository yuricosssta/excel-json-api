import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
// import DataEntry from '../models/DataEntry'; // Importa o modelo do Mongoose
import dadosGenericos from '../models/dados.genericos';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
  }

  const allowedMimeTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Formato de arquivo inválido. Apenas .xls ou .xlsx.' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        return res.status(400).json({ error: 'Planilha vazia ou corrompida.'});
    }

    const worksheet = workbook.Sheets[sheetName];
    let jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Mapeamento manual (caso as chaves estejam erradas)
    jsonData = jsonData.map((item: any) => ({
      grupo: item.grupo || item.Grupo || item['GRUPO'] || '',
      composicao: item.codigo_composicao || item['COMPOSICAO'] || item['codigo_composicao'] || '',
      tipo: item.tipo || item['TIPO'] || item['tipo'] || '',
      insumo: item.codigo_item || item['INSUMO'] || item['codigo_item'] || '',      
      descricao: item.descricao || item.Descrição || item['DESCRICAO'] || '',
      unidade: item.unidade || item.Unidade || item['UNIDADE'] || '',
      coeficiente: item.coeficiente || item.Coeficiente || item['COEFICIENTE'] || '',
      custo: item.situacao || item.Situação || item['CUSTO'] || '',
      
    }));

    if (jsonData.length === 0) {
        return res.status(400).json({ error: 'Nenhum dado encontrado na planilha.' });
    }

    // --- LÓGICA DO MONGOOSE ---
    // Usa o método insertMany para salvar todos os objetos do array jsonData de uma só vez.
    // Isso é muito mais eficiente do que salvar um por um em um loop.
    const result = await dadosGenericos.insertMany(jsonData);
    
    // Envia uma resposta de sucesso com a contagem de documentos inseridos.
    res.status(201).json({ 
        message: 'Dados importados e salvos com sucesso!',
        count: result.length,
        data: result // Opcional: retornar os dados salvos
    });

  } catch (error) {
    console.error('Erro ao processar e salvar o arquivo:', error);
    res.status(500).json({ error: 'Ocorreu um erro interno ao processar e salvar os dados.' });
  }
});

/**
 * Rota GET para pesquisar dados com filtros dinâmicos.
 * Os filtros são passados como query parameters na URL.
 * Ex: /api/data?Nome=João&Idade=30
 */
router.get('/data', async (req: Request, res: Response) => {
    try {
        // Constrói um objeto de filtro a partir dos query parameters da requisição
        const filter: { [key: string]: any } = {};
        
        for (const key in req.query) {
            if (Object.prototype.hasOwnProperty.call(req.query, key)) {
                const value = req.query[key] as string;
                
                // Trata valores numéricos
                if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
                    filter[key] = Number(value);
                } else {
                    // Para strings, usa uma regex para busca case-insensitive
                    filter[key] = { $regex: new RegExp(`^${value}$`, 'i') };
                }
            }
        }

        // Usa o objeto de filtro para buscar os dados no banco
        const data = await dadosGenericos.find(filter);

        if (data.length === 0) {
            return res.status(404).json({ message: 'Nenhum dado encontrado com os filtros fornecidos.' });
        }

        res.status(200).json(data);

    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        res.status(500).json({ error: 'Erro interno ao buscar dados.' });
    }
});


export default router;