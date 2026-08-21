//Import 
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const router = require('./routers/client/index.router')

//Configue pug
app.set('views', './views');
app.set('view engine', 'pug');


//route
router(app);

//Start the server and listen on the defined port
app.listen(PORT, () => {
  console.log(`Server is successfully running on http://localhost:${PORT}`);
});
