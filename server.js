const express = require("express");
const crypto = require("crypto");
const path = require("path");

const app = express();


// Render automatically PORT deta hai
const PORT = process.env.PORT || 3000;


// Token memory store
const tokens = new Map();


// Token validity
const TOKEN_TIME = 30 * 1000;


// Static files
app.use(express.static(__dirname));


// ------------------------------
// Generate secure CSS link
// ------------------------------

app.get("/generate-link", (req, res) => {


    const token = crypto
        .randomBytes(32)
        .toString("hex");


    tokens.set(token, {
        expiry: Date.now() + TOKEN_TIME
    });


    res.json({

        url:
        `/assets/secure-style.css?token=${token}`,

        expires:
        "30 seconds"

    });


});




// ------------------------------
// Protected CSS
// ------------------------------

app.get("/assets/secure-style.css",
(req,res)=>{


    const token =
    req.query.token;



    if(!token){

        return res
        .status(403)
        .send("Missing token");

    }



    const tokenData =
    tokens.get(token);



    if(!tokenData){

        return res
        .status(404)
        .send("Invalid token");

    }




    if(Date.now() > tokenData.expiry){


        tokens.delete(token);


        return res
        .status(403)
        .send("Expired token");

    }



    // One time use
    tokens.delete(token);



    res.setHeader(
        "Cache-Control",
        "no-store"
    );



    res.sendFile(
        path.join(
            __dirname,
            "style.css"
        )
    );


});




// Start server

app.listen(PORT,()=>{

console.log(
`Server running on port ${PORT}`
);

});
