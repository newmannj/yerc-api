const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const mongoclient = require('mongodb').MongoClient;
const {v4: uuidv4} = require('uuid');
const Joi = require('joi');

const port = 3000;
app.use(express.json());

mongoclient.connect('mongodb://localhost:27017/yerc-db', (err, client) => {
    if(err) console.log(err)

    const db = client.db('yerc-db');

    app.post('/api/auth/signup', (req,res) => {
        //Validate the data.
        const signupSchema = Joi.object({
            username: Joi.string()
                .required(),
            password: Joi.string()
                .required(),
            fullname: Joi.string()
                .required(),
            email: Joi.string()
                .required()
                .email(),
            role: Joi.string()
                .required()
                .valid('Guest', 'EPIIC_Member', 'EPIIC_Scientist', 'EPIIC_Steward', 'EPIIC_Site_Admin', 'EPIIC_Field_Biologist')
        })
        const {error, value} = signupSchema.validate(req.body);
        if(error !== undefined) {
            res.status(500);
            res.send(error.details[0].message);
        } else {
            //Check for existing username
            db.collection('users').find({username:req.body.username}).toArray((err, results) => {
                if (err) throw err;
                if(results.length === 0) {
                    //TODO: Hash password
                    let userdoc = req.body;
                    userdoc.sub = uuidv4();
                    const d = new Date();
                    const curTime = d.getTime();
                    userdoc.createdOn = curTime;
                    userdoc.lastUpdated = curTime;
                    db.collection('users').insertOne(userdoc);
                    res.status(200);
                    res.send({data: { username: req.body.username, role: req.body.role}, message: "Registered successfully!"});
                } else {
                    res.status(409);
                    res.send("Error: Username already exists.");
                }
            })
        }
    })

    app.post('/api/auth/signin', (req, res) => {
        //TODO: Authenticate user
        db.collection('users').findOne({username:req.body.username}, (err, result) => {
            if(err) throw err;
            if(!result) {
                res.status(404);
                res.send('username not found');
            } else {
                if(req.body.password === result.password) {
                    res.send(
                        {
                            status: 200,
                            id_token: 12345,
                            token_type: "Bearer",
                            data: {
                                username: "<username>",
                                fullname: "<fullname>",
                                email: "<email>",
                                role: "<role>"
                            }
                        });
                } else {
                    res.status(500);
                    res.send('bad password');
                }
            }   
        })
    })

    app.put('/api/user/update', (req, res) => {
        const updateSchema = Joi.object({
            sub: Joi.string().uuid().required(),
            data: {
                username: Joi.string(),
                role: Joi.string(),
                email: Joi.string(),
                fullname: Joi.string()
            }
        })
        const {error, value} = updateSchema.validate(req.body);
        //TODO: Add auth checking.
        db.collection('users').findOne({sub:req.body.sub}, (err, result) => {
            if(err) console.log(err);
            if(result) {
                //TODO: Do the update.

            } else {
                res.status(400);
                res.send('User not found!');
            }
        })
        res.status(404);
        res.send('not yet implemented!');
    })

    app.get('/api/user/:username', (req, res) => {
        //TODO: Add auth checking.
        db.collection('users').findOne({username:req.params.username}, (err, result) => {
            if(err) console.log(err);
            if(result) {
                res.status(200);
                res.send(result);
            } else {
                res.status(400);
                res.send('User not found!');
            }
        });
    })
    
    app.delete('/api/user/:sub', (req, res) => {
        //TODO: Add auth checking.
        db.collection('users').deleteOne({sub:req.params.sub}, (err, result) => {
            if(err) console.log(err);
            if(result.deletedCount === 1) {
                res.status(200);
                res.send('User successfully deleted!');
            } else {
                res.status(400);
                res.send('User not deleted');
            }
        });
    })

});

app.listen(port, () => {
    console.log(`Listening on http://localhost/${port}`)
})



