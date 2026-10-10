//Import
require('dotenv').config();
const express = require('express');
const path = require('path');
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const flash = require("express-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const database = require('./configs/database.js');


const systemConfig = require('./configs/system.js');
const routerClient = require('./routers/client/index.router')
const routerAdmin = require('./routers/admin/index.router')
database.connect();
const app = express();
const port = process.env.PORT;

app.use(methodOverride("_method"));

app.use(bodyParser.urlencoded({ extended: false }));

//Configue pug
app.set('views', `${__dirname}/views`);
app.set('view engine', 'pug');

//Flash
app.use(cookieParser("DVMLDN"));
app.use(session({ cookie: { maxAge: 60000 } }));
app.use(flash());

//tinymce
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

//app locals Variables
app.locals.prefixAdmin = systemConfig.prefixAdmin;

app.use(express.static(`${__dirname}/public`));

//route
routerClient(app);
routerAdmin(app);

//Start the server and listen on the defined port
app.listen(port, () => {
  console.log(`Server is successfully running on http://localhost:${port}`);
});
