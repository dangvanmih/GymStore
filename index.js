//Import 
const express = require('express');
const database = require('./configs/database.js');
require('dotenv').config();

const routerClient = require('./routers/client/index.router')
const routerAdmin = require('./routers/admin/index.router')
database.connect();
const app = express();
const port = process.env.PORT;

//Configue pug
app.set('views', './views');
app.set('view engine', 'pug');

app.use(express.static('public'));

//route
routerClient(app);
routerAdmin(app);

//Start the server and listen on the defined port
app.listen(port, () => {
  console.log(`Server is successfully running on http://localhost:${port}`);
});
