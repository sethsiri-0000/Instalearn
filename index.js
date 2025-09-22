const bodyParser = require('body-parser');
const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const cookies = require('cookie-parser');
const cors = require('cors');
const { finished } = require('nodemailer/lib/xoauth2');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('frontend'));
app.use(cookies());
app.use(cors());

//GLOBAL VARIABLES

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

let message = "Hi! This is InstaLearn authentication."+
"\n\nYour secret code is ";

let sc;
let date;
let currentDate;
let diff;
let username;
let password;
let emailSign;
let con;

//ROOT

try{

let rootCon = mysql.createConnection({
    host:"localhost",
    user: "root",
    password: "Sethumsiri@0114",
    database:"instalearn"
});

//COMMON FUNCTIONS

    //EMAIL

function sendMail(email){
    try{
    let num = Math.round(Math.random() * 1000000);

    var mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Instalearn Account Authentification',
        text: message + num.toString() + "\n\nThank you for using InstaLearn"
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){console.log(error);}
    });

    console.log("Success email");

    return num;
    }
    catch(errrr){
        console.log("unsuccess thing");
        console.log(errrr);
    }
};

    //ROUND

function round(a, b){
    console.log((a.getTime() - b.getTime()) / 1000 / 60);
    return Math.abs((a.getTime() - b.getTime()) / 1000 / 60); 
}

//CHECK
function check(req, res){
    if (!req.cookies || !req.cookies.name) {
        return res.redirect('login.html');
    }
    else{
    rootCon.query('SELECT pass FROM info WHERE name=?;',[req.cookies.name],
        function (errr, results){ 
            if (errr || results.length === 0) {
            console.log("Error or no results found:", errr);
            return res.redirect('login.html');
            }

            con = mysql.createConnection({
                host: "localhost",
                user: req.cookies.name,
                password: results[0].pass,
                database: "instalearn"
            });
        
    con.connect(err =>{
        if(err){
            return res.status(500).send("sorry...... Database not working");
        }
        res.redirect('/main.html');
    });

    });
    }
}

//APP

app.get('/', (req, res) => {
    check(req, res);
});

//LOGIN

app.post('/login', (req, res) => {
    username = req.body.username;
    password = req.body.password;

    con = mysql.createConnection({
        host: "localhost",
        user: username,
        password: password,
        database: "instalearn"
    });

    con.connect(function(err){
        if(err){
            console.log(err);
            console.log(username, password);
            return res.status(500).redirect('/login.html');
        }else{
        console.log("Success db");
        con.query("SELECT email FROM info WHERE name = ?", [username],
            function(err, result){
                if(err) throw err;
                console.log("Success access");
                sc = sendMail(result[0].email);
                date = new Date();
                res.redirect('/authenticate.html');
            }
        );
    }
    });
});

//SIGNUP 

app.post('/signin', (req, res) => {
    username = req.body.username;
    password = req.body.password;
    emailSign = req.body.email;

    if (req.body.confPass === password) {
        const createUSER = `CREATE USER '${username}'@'localhost' IDENTIFIED BY '${password}';`;
        const makeROOT = `GRANT ALL PRIVILEGES ON instalearn.* TO '${username}'@'localhost';`;

        rootCon.query(createUSER, function (err) {
            if (err){
                console.log(err);
                 return res.status(500).send("Error creating user");
            }
                 console.log("User created successfully");

            rootCon.query(makeROOT, function (err) {
                if (err) return res.status(500).send("Error granting privileges");

                const insertINFO = "INSERT INTO info (name, email, pass) VALUES (?, ?, ?);";
                rootCon.query(insertINFO, [username, emailSign, password], function (err) {
                    if (err) {
                        console.log(err);
                        return res.status(500).send("Error inserting user info");
                    }
                    console.log("User info inserted successfully");
                    con.query("SELECT email FROM info WHERE name = ?", [username],
                        function(err, result){
                            if(err) throw err;
                            console.log("Success access");
                            sc = sendMail(result[0].email);
                            date = new Date();
                            res.redirect('/authenticate.html');
                        }
                    );
                    res.redirect('/authenticate.html');
                });
            });
        });
    }
});


//AUTHENTICATE

app.post('/authenticate', (req, res) => {
    let nm = req.body.code;
    currentDate = new Date();
    
    diff = round(currentDate, date);

    //PROOF

    if(nm == sc && diff <= 10){
        res.cookie('name', username, {httpOnly:false});
        res.redirect("/main.html");
    }
    else{
        res.redirect("/authenticate.html");
    }
});

app.listen(port, () => {
    console.log(`App is running on port ${port}`);
});

//ADD NEW CLICK

app.post('/createClick', (req, res) => {
    let nam = req.body.question;
    let op1 = req.body.op1;
    let op2 = req.body.op2;
    let trueOp = () => {
        if (req.body.trueOp == "Option 1"){
            return "op1";
        }
        else{
            return "op2";
        }
    }

    let infoAfter = req.body.infoAfter;

    con.query("INSERT INTO clicks(question, option1, option2, trueOp, addText, who) VALUES(?, ?, ?, ?, ?, ?);", 
        [nam, op1, op2, trueOp(), infoAfter, req.cookies.name], function(err, result){
            if (err) throw err;
            console.log("success");
            console.log(nam, op1, op2, trueOp(), infoAfter);
        });

        res.redirect('/main.html');

});

app.post('/ups', (req, res) => {
    if (req.body.give === "true") {
        con.query(`
            SELECT * FROM clicks 
            WHERE id NOT IN (SELECT id FROM complete WHERE name = ?) 
            ORDER BY RAND() 
            LIMIT 1;
        `, [req.cookies.name], (err, results) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Database error');
            }
            if (results.length > 0) {
                const click = results[0];
                let sendStr = `${click.question};${click.option1};${click.option2};${click.who};${click.addText};${click.trueOp}`;
                
                // Retrieve user points
                con.query('SELECT points FROM info WHERE name=?', [req.cookies.name], (err, userResults) => {
                    if (err) return res.status(500).send('Database error');
                    
                    const points = userResults[0].points;
                    sendStr += `;${points};${req.cookies.name}`;
        
                    // Insert into complete table
                    con.query('INSERT INTO complete (id, name) VALUES(?, ?)', [click.id, req.cookies.name], (err) => {
                        if (err) {
                            console.error(err.message);
                            return res.status(500).send('Database error');
                        }
                        res.send(sendStr);
                    });
                });
            } else {
                res.send('none');
            }
        });
    }
});

//FIND ANSWER

app.post('/ups-ans', (req, res) => {
    if(req.body.ans == 'true'){
        con.query("UPDATE info SET points = points + 1 WHERE name=?;", [req.cookies.name], (err) => {
            if(err){
                console.log(err);
            }
        });
    }
});


}
catch(err){
    console.log(err.Message());
}

