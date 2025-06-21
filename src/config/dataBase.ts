import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error('ERRO: A variável de ambiente MONGO_URI não está definida.');
      process.exit(1); // Encerra a aplicação se a URI não estiver configurada
    }
    
    await mongoose.connect(mongoURI);
    
    console.log('🐚 MongoDB conectado com sucesso.');
  } catch (error) {
    console.error('Erro ao conectar com o MongoDB:', error);
    process.exit(1); // Encerra a aplicação em caso de falha na conexão
  }
};

export default connectDB;