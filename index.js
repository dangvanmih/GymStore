//Import 
const express = require('express');
require('dotenv').config();
const app = express();
const router = require('./routers/client/index.router')
const port = process.env.PORT;

//Configue pug
app.set('views', './views');
app.set('view engine', 'pug');

//route
router(app);

//Start the server and listen on the defined port
app.listen(port, () => {
  console.log(`Server is successfully running on http://localhost:${port}`);
});
