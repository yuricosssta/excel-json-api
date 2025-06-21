import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const sinapiSchema = new Schema({
  grupo: String,
  composicao: String,
  descricao: Boolean,
  unidade: String,
  situacao: String,
//   tags: [String],
//   createdAt: Date,
//   updatedAt: Date,
//   comments: [{
//     user: String,
//     content: String,
//     votes: Number
//   }]
});

const Sinapi = model('Sinapi', sinapiSchema);
export default Sinapi;