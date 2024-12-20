require("dotenv").config();

const Note = require("./models/notes");

/* Como ahora utilizamos Express debemos instalar el paquete `npm install express --save`.

Importamos la función "express()" para poder contruir el servidor web.

¡IMPORTANTE!
Podemos instalar el paquete "nodemon" para aplicar los cambios en el servidor web sin reiniciarlo `npm install nodemon --save-dev`.
 */
const express = require("express");
/* ¡IMPORTANTE!
No es posible realizar solicitudes HTTP desde el cliente al servidor web a causa de la política de mismo origen (el cliente se encuentra en el puerto 5173 mientras que el servidor web se encuentra en el puerto 3001).

Por este motivo CORS bloquea las solicitudes de origen cruzado. Para resolverlo instalamos el middleware de "cors" `npm install cors --save`.
*/
const cors = require("cors");
const app = express();

app.use(cors()); // Implementamos el middleware de "cors".

/* Tras compilar la aplicación cliente con `npm run build`, copiamos la carpeta "dist" para traerla a la raíz del servidor web.

Implementamos el middleware de "express.static()" para que Express muestre contenido estático. (Siempre que reciba solicitudes HTTP GET a la dirección "/index.html" o "/" mostrará el frontend de React)
*/
app.use(express.static("dist"));

/* ¡IMPORTANTE!
Modificamos el "./package.json" del servidor web para poder compilar la versión de producción de nuestra aplicación React. Para ello creamos scripts personalizados:
  - "build:ui": "rm -rf dist && cd ../notes && npm run build && cp -r dist ../notes-backend"
  - "deploy:full": "npm run build:ui && git add . && git commit -m 'uibuild' && git push -u 'https://github.com/h-pozuelo/notes-backend.git' main"

Para poder ejecutar dichos comandos debemos establecer la "bash" como terminal por defecto:
  - `npm config set script-shell "C:\\Program Files\\git\\bin\\bash.exe"`

Para poder acceder al servidor web desde el front-end debemos de configurar un proxy dentro del fichero "./vite.config.js".
*/

// Creamos un middleware personalizado (json-parser también es un middleware). Imprime información sobre cada solicitud que se evía al servidor.
const requestLogger = (request, response, next) => {
  console.log("Method:", request.method);
  console.log("Path:", request.path);
  console.log("Body:", request.body);
  console.log("---");
  next(); // Cede el control al próximo middleware.
};

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError")
    return response.status(400).send({ error: "malformatted id" });
  if (error.name === "ValidationError")
    return response.status(400).send({ error: error.message });
  next(error);
};

app.use(express.json());
app.use(requestLogger); // Llamamos al middleware de "requestLogger" tras haber llamado al "json-parse". De lo contrario no podríamos acceder a la propiedad "request.body" dentro del middleware.

let notes = [
  { id: 1, content: "HTML is easy", important: true },
  { id: 2, content: "Browser can execute only JavaScript", important: false },
  {
    id: 3,
    content: "GET and POST are the most important methods of HTTP protocol",
    important: true,
  },
];

/* Definimos dos rutas a la aplicación:
    - "/" : Define un controlador de eventos que maneja solicitudes HTTP GET realizadas a la raíz de la aplicación.
    - "/api/notes" : Define un controlador de eventos que maneja solicitudes HTTP GET realizadas a la ruta "api/notes" de la aplicación.
*/
app.get("/", (request, response) => {
  response.send("<h1>Hello World!</h1>"); // Lo que va a retornar la ruta "/" de la API. Por defecto tiene un "statusCode: 200", siendo un contenido de tipo texto HTML.
});

app.get("/api/notes", (request, response) => {
  // response.json(notes); // Como usamos el método ".json()" del parámetro "response" no es necesario convertir la matriz a JSON ni especificar el tipo de contenido.
  Note.find({}).then((notes) => response.json(notes));
});

/* ¡IMPORTANTE!
Cuando enviamos parámetros a través de la ruta se convierten a cadenas de texto. Por eso al momento de comparar explícitamente los valores no encontraba la nota con dicho "id".

Debemos castear el valor del "id" al tipo "Number".
*/
app.get("/api/notes/:id", (request, response, next) => {
  // const id = Number(request.params.id);
  // const note = notes.find((note) => {
  //   console.log(note.id, typeof note.id, id, typeof id, note.id === id);
  //   return note.id === id;
  // });

  // console.log(note);

  // // Si la nota existe la devolvemos en formato JSON...
  // if (note) {
  //   response.json(note);
  // } else {
  //   response.statusMessage = "Note Not Found";
  //   response.status(404).end(); // En caso contrario especificamos el "statusCode: 400"; el método ".end()" indica que se va a responder a la solicitud HTTP GET sin devolver datos.
  // }

  Note.findById(request.params.id)
    .then((note) => {
      // Si la nota con dicho "id" no existe (null).
      if (!note) return response.status(404).end();
      response.status(200).json(note);
    })
    /* Controlamos cuando las solicitudes a la base de datos son rechazadas.
    
    La función "next()" que recibe como parámetro el error va a pasarlo hacia el middleware de Express.js que controla errores.

    En caso de no pasar parámetros a la función "next()" pasaría al próximo middleware o ruta.
    */
    // Controlamos cuando las solicitudes a la base de datos son rechazadas.
    .catch((error) => next(error)); // La función "next()" va a pasar el error hacia adelante (al próximo middleware).
});

app.delete("/api/notes/:id", (request, response, next) => {
  // const id = Number(request.params.id);
  // notes = notes.filter((note) => note.id !== id);

  // response.status(204).end();

  Note.findByIdAndDelete(request.params.id)
    .then((result) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

/* ¡IMPORTANTE!
Para acceder a los datos enviados a través de una solicitud HTTP POST, debemos de especificar al comienzo de nuestra aplicación el uso del "json-parser" (app.use(express.json());).

    - "json-parser" : Toma los datos JSON de una solicitud HTTP, los transforma en un objeto JavaScript para poder adjuntarlos a la propiedad "body" del objeto "request" antes de llamar al controlador de ruta.
*/
const generateId = () => {
  const maxId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) : 0;
  return maxId + 1;
};

app.post("/api/notes", (request, response, next) => {
  const body = request.body;

  /* Si el cuerpo de la solicitud HTTP no contiene la propiedad "content" se devuelve un "statusCode: 400", con el método ".json()" devolvemos un objeto personalizado con un mensaje de error (en este caso no se ha modificado el mensaje de error de la respuesta sino que hemos devuelto un objeto con el mensaje).
   */
  if (!body.content)
    return response.status(400).json({ error: "content missing" }); // Con el "return" no continua la ejecución a continuación.

  // const note = {
  //   content: body.content,
  //   important: Boolean(body.important) || false,
  //   id: generateId(),
  // };

  // notes = notes.concat(note);

  // response.json(note);

  const note = new Note({
    content: body.content,
    important: Boolean(body.important) || false,
    // id: generateId(), // La base de datos va a crear el "id".
  });

  note
    .save()
    .then((savedNote) => {
      response.json(savedNote);
    })
    .catch((error) => next(error));
});

app.put("/api/notes/:id", (request, response, next) => {
  const body = request.body;

  const note = {
    content: body.content,
    important: body.important,
  };

  /* ¡IMPORTANTE!
  La función "findByIdAndUpdate()" recibe como parámetros:
    - "id" : El identificador del elemento en la base de datos.
    - "object": El objeto JavaScript con la información a actualizar (no es un nuevo objeto nota creado con el constructor de Note).
    - "options": Por defecto el controlador de eventos devuelve el elemento sin la modificaciones nuevas, para que retorne el elemento con las propiedades actualizadas especificamos la propiedad "new" como "true".
  */
  Note.findByIdAndUpdate(request.params.id, note, {
    new: true,
    runValidators: true,
    context: "query",
  })
    .then((updatedNote) => {
      response.status(200).json(updatedNote);
    })
    .catch((error) => next(error));
});

// Cuando queremos ejecutar un middleware dentro de un controlador de eventos de rutas, debemos implementarlo antes de definir las rutas. En este caso el middleware va a servir para responder a aquellas solicitudes que no coinciden con las rutas definidas, por lo que lo implementamos al final del servidor web.
app.use(unknownEndpoint);

app.use(errorHandler); // El controlador de error siempre debe ser implementado como el último middleware.

// Como vamos a desplegar el servidor web en "Render" debemos de obtener el nuevo puerto de las variables de entorno.
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
