const express = require('express');
const logger = require('morgan');

const apiRouter = require('./routes/api/v1.0');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/api/v1.0', apiRouter);

module.exports = app;
