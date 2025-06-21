// Importações dos módulos necessários
import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import connectDB from './config/dataBase';
import uploadRoutes from './routes/upload';
import cors from 'cors';


// Carrega as variáveis de ambiente do arquivo .env
dotenv.config(); 

// Conecta ao banco de dados MongoDB
connectDB();

// Inicializa a aplicação Express
const app: Application = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota principal para verificar se a API está online
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Servidor no ar! Conectado ao MongoDB.');
});

// Usa as rotas definidas no arquivo de upload
app.use('/api', uploadRoutes);

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});