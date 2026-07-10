const express = require("express");
const crypto = require("crypto");
const path = require("path");
const { DateTime } = require("luxon");


const app = express();


const PORT = process.env.PORT || 3000;


// ===============================
// Token Memory Storage
// ===============================

const tokens = new Map();


const TOKEN_LIFETIME = 30 * 1000;


// ===============================
// Static Files
// ===============================

app.use(express.static(__dirname));




// ===============================
// Timezone Condition
// ===============================

function timezoneAllowed(){


    const japanTime =
    DateTime
    .now()
    .setZone("Asia/Tokyo");


    const indiaTime =
    DateTime
    .now()
    .setZone("Asia/Kolkata");



    const japanHour =
    japanTime.hour;


    const indiaHour =
    indiaTime.hour;



    // Allowed time window
    // 9 AM to 6 PM

    const japanAllowed =
    japanHour >= 9 &&
    japanHour <= 18;


    const indiaAllowed =
    indiaHour >= 9 &&
    indiaHour <= 18;



    return (
        japanAllowed ||
        indiaAllowed
    );

}




// ===============================
// Generate Token
// ===============================

app.get("/generate-link",(req,res)=>{


    const token =
    crypto
    .randomBytes(32)
    .toString("hex");



    tokens.set(token,{

        expiry:
        Date.now() + TOKEN_LIFETIME

    });



    res.json({

        css:
        `/assets/secure-style.css?token=${token}`,

        validFor:
        "30 seconds"

    });


});




// ===============================
// Secure CSS Endpoint
// ===============================

app.get(
"/assets/secure-style.css",
(req,res)=>{


    const token =
    req.query.token;



    // Token missing

    if(!token){

        return res
        .status(403)
        .send(
            "Token required"
        );

    }



    const tokenData =
    tokens.get(token);



    // Invalid token

    if(!tokenData){

        return res
        .status(404)
        .send(
            "Invalid token"
        );

    }



    // Expired token

    if(
        Date.now()
        >
        tokenData.expiry
    ){


        tokens.delete(token);


        return res
        .status(403)
        .send(
            "Token expired"
        );

    }




    // Timezone validation

    if(!timezoneAllowed()){


        return res
        .status(403)
        .send(
            "Access unavailable"
        );

    }





    // One time use delete

    tokens.delete(token);




    // Disable cache

    res.setHeader(
        "Cache-Control",
        "no-store"
    );



    // Send CSS

    res.sendFile(
        path.join(
            __dirname,
            "style.css"
        )
    );


});




// ===============================
// Test Route
// ===============================

app.get("/test",(req,res)=>{

    res.send(
        "Server Working"
    );

});




// ===============================
// Start Server
// ===============================

app.listen(
PORT,
()=>{

console.log(
`Server running on port ${PORT}`
);

});
