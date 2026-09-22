//Import 
const express = require('express');
const methodOverride = require("method-override");
const bodyParser = require("body-parser")
const database = require('./configs/database.js');
require('dotenv').config();

const systemConfig = require('./configs/system.js');
const routerClient = require('./routers/client/index.router')
const routerAdmin = require('./routers/admin/index.router')
database.connect();
const app = express();
const port = process.env.PORT;

app.use(methodOverride("_method"));

app.use(bodyParser.urlencoded({extended: false}));

//Configue pug
app.set('views', './views');
app.set('view engine', 'pug');

//app locals Variables
app.locals.prefixAdmin = systemConfig.prefixAdmin;

app.use(express.static('public'));

//route
routerClient(app);
routerAdmin(app);

//Start the server and listen on the defined port
app.listen(port, () => {
  console.log(`Server is successfully running on http://localhost:${port}`);
});
