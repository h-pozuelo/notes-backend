/* `npm install mongoose --save`

    - ConnectionString: mongodb+srv://hugopmempleo:<db_password>@cluster0.u24mb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
 */
const mongoose = require("mongoose");

// Cuando ejecutamos `node mongo.js password` el último elemento de la matriz "process.argv" corresponde a la contraseña del usuario de base de datos.
if (process.argv.length < 3) {
  console.log("give password as argument");
  process.exit(1);
}

const password = process.argv[2];

// Para reemplazar la base de datos en donde almacenar las notas tan solo es necesario añadir el nombre de la nueva base de datos al final de la URI. (Si no existe se creará automáticamente)
const url = `mongodb+srv://hugopmempleo:${password}@cluster0.u24mb.mongodb.net/notesApp?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.set("strictQuery", false);

mongoose.connect(url);

// Definimos el esquema (interfaz) de la colección (tabla) "notes" mediante el constructor de la clase "mongoose.Schema".
const noteSchema = new mongoose.Schema({
  content: String,
  important: Boolean,
});

// Una vez definido el esquema podemos construir el modelo a partir de el. Como parámetros le pasamos el nombre del modelo (el nombre de la colección será su plural) y el esquema.
const Note = mongoose.model("Note", noteSchema);

// A partir del modelo construimos una nota.
const note = new Note({
  content: "HTML is easy",
  important: true,
});

// // -CREATE NOTE-
// note.save().then((result) => {
//   console.log("note saved!", result);
//   mongoose.connection.close(); // Es necesario cerrar la conexión con la base de datos cuando finalizamos la tarea.
// });

// -GET ALL NOTES-
// El método ".find()" recibe como parámetro un objeto que cumple con el esquema de "noteSchema". Si pasamos como parámetro un objeto vacío devolverá todas las notas.
Note.find({ important: true }).then((result) => {
  result.forEach((note) => {
    console.log(note);
  });
  mongoose.connection.close();
});
