const express = require('express');
const bcrypt = require('bcrypt');
const mongoClient = require('mongodb').MongoClient;
const nodeMailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongoUrl = process.env.MONGO_URL;
const dbName = 'forgot-password';
module.exports = { express, bcrypt, mongoClient, mongoUrl, dbName, jwt, nodeMailer };
