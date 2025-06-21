import mongoose, { Schema, Document } from 'mongoose';

// Define uma interface que representa um documento no MongoDB.
// Como os dados do Excel podem ter quaisquer colunas, usamos um índice de assinatura.
export interface IDadosGenericos extends Document {
  [key: string]: any;
}

// Cria um Schema do Mongoose.
// O objeto vazio {} com a opção strict: false permite que qualquer dado seja salvo.
// Isso é perfeito para a natureza flexível dos dados de uma planilha.
const DadosGenericosSchema: Schema = new Schema({}, { strict: false, timestamps: true });

// Cria e exporta o Model do Mongoose.
// O Mongoose criará uma coleção chamada 'dataentries' (plural e minúsculo) no banco de dados.
export default mongoose.model<IDadosGenericos>('DadosGenericos', DadosGenericosSchema);