const express = require('express');
const app = express();
const morgan = require('morgan')
const cors = require('cors');

app.use(cors());
app.use(express.json());

const captureResponse = (req, res, next) => {
  let originalSend = res.send;
  let responseBody;

  res.send = function (body){
    if(typeof body == "object"){
      responseBody = JSON.stringify(body); // Convert object to string
    } else{
      responseBody = body; // handle string or other formats
    }

    res.send = originalSend; // Restore original 'send' method
    return res.send(body);
  }

  res.on('finish', () => {
    req.responseBody = responseBody; // Attach response body to the request object
  })

  next();
}

// Custom Morgan token for response body
morgan.token('response-body', (req) => req.responseBody || '');

// Apply middlewares
app.use(captureResponse);
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :response-body'));

let persons = [
    { 
      "id": "1",
      "name": "Arto Hellas", 
      "number": "040-123456"
    },
    { 
      "id": "2",
      "name": "Ada Lovelace", 
      "number": "39-44-5323523"
    },
    { 
      "id": "3",
      "name": "Dan Abramov", 
      "number": "12-43-234345"
    },
    { 
      "id": "4",
      "name": "Mary Poppendieck", 
      "number": "39-23-6423122"
    }
];

app.get('/api/persons', (request, response) => {
    response.json(persons);
})

app.get('/api/persons/:id', (request, response) => {
  let personId = request.params.id;
  const personData = persons.find(person => person.id === personId);

  if(!personData){
    response.statusCode = 404;
    response.end("This id person data not found");
  } 

  response.json(personData);
})

app.post('/api/persons', (request, response) => {

  let newData = request.body;

  let maxId = persons.length > 0 
                ? Math.max(...persons.map(person => Number(person.id)))
                : 1;

  // check name or number is missing or not
  if(!newData.name || !newData.number){
    return response.status(400).json({
      error: 'name or number missing'
    })
  }

  // check name is already exists in the phonebook or not
  let checkName = persons.filter(person => person.name === newData.name);

  if(checkName.length > 0){
    return response.status(400).json({
      error: 'name must be unique, this already exists'
    })
  }

  newData.id = String(maxId + 1);
  persons = persons.concat(newData);
  response.json(newData);
})

app.delete('/api/persons/:id', (request, response) => {
  let personId = request.params.id;

  // Find the person to be deleted
  let deletedPerson = persons.find(person => person.id === personId);

  if (!deletedPerson) {
    response.status(404).send("This id person data not found");
    return;
  }

  // Delete person from array
  persons = persons.filter(person => person.id !== personId);
  console.log("Deleted Persons Data", deletedPerson);

  response.json(deletedPerson);
});

app.get('/info', (request, response) => {
  let countPersons = persons.length;

  let timestamp = new Date();

  response.send(`
    <p>
      Phonebook has info for ${countPersons} people
    </p>
    <p>
      ${timestamp}
    </p>  
  `);
})

// if no request if found
const unkownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unkownEndpoint)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})