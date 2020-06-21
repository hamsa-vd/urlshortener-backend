const express = require('express');
const bcrypt = require('bcrypt');
const mongoClient = require('mongodb').MongoClient;
const nodeMailer = require('nodemailer');
require('dotenv').config();
const mongoUrl = process.env.MONGO_URL;
const dbName = 'forgot-password';
module.exports = { express, bcrypt, mongoClient, mongoUrl, dbName, nodeMailer };
