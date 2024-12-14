// Para iniciar el servidor web `npm run dev password`
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

/* Para no codificar la dirección a la base de datos vamos a pasarla a través de una variable de entorno.
    - `npm install dotnet --save`
    - Creamos el fichero ".env" en la raíz del servidor web.
    - Ignoramos el fichero ".env" dentro del fichero ".gitignore".
*/
const url = process.env.MONGODB_URI;

console.log("connecting to", url);

mongoose
  .connect(url)
  .then((result) => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connecting to MongoDB:", error.message);
  });

// En vez de usar "noteSchema.set()" para establecer opciones personalizadas le podemos pasar el objeto de opciones como 2do parámetro al constructor del esquema.
const noteSchema = new mongoose.Schema(
  {
    // Definiendo la propiedad con un objeto podemos validar el formato de los datos antes de almacenarlo en la base de datos.
    content: {
      type: String,
      minLength: 5,
      require: true,
    },
    important: Boolean,
  },
  {
    // La propiedad "toJSON" hace referencia a la transformación de la respuesta a una solicitud HTTP en un objeto de JavaScript.
    toJSON: {
      transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
      },
    },
  }
);

/* ¿Cómo lo exportamos en Node.js?
    - module.exports = mongoose.model("Note", noteSchema);

¿Cómo se exportaría siguiendo el estándar ES6?
    - export default { mongoose.model("Note", noteSchema) };

¿Cómo lo importamos en Node.js?
    - const Note = require("./models/notes");

¿Cómo se importaría siguiente el estándar ES6?
    - import Note from "./models/notes";
*/
module.exports = mongoose.model("Note", noteSchema);
