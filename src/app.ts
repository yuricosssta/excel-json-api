import express, { Application, Request, Response } from 'express';
import uploadRoutes from '../routes/upload';

const app: Application = express();
const port: number = 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('API para conversão de Excel para JSON está no ar!');
});

app.use('/api', uploadRoutes);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});