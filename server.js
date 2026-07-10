const express = require("express");
const crypto = require("crypto");
const path = require("path");
const { DateTime } = require("luxon");


const app = express();

const PORT = process.env.PORT || 3000;


// Token storage
const tokens = new Map();


const TOKEN_TIME = 30 * 1000;



// Static
app.use(express.static(__dirname));



// =============================
// Timezone Check
// =============================

function timezoneAllowed(){


    const japan =
    DateTime
    .now()
    .setZone("Asia/Tokyo")
    .hour;



    const india =
    DateTime
    .now()
    .setZone("Asia/Kolkata")
    .hour;



    return (

        (japan >= 0 && japan <= 23)

        ||

        (india >= 0 && india <= 23)

    );

}




// =============================
// Generate Token
// =============================

app.get("/generate-link",(req,res)=>{


    const token =
    crypto
    .randomBytes(32)
    .toString("hex");



    tokens.set(token,{

        expiry:
        Date.now()+TOKEN_TIME

    });



    res.json({

        token:token,

        css:
        `/assets/style.css?token=${token}`,

        jsPath:
        `/assets/js/`

    });


});






// =============================
// Secure Assets
// =============================

app.get("/assets/:file",(req,res)=>{


    const token =
    req.query.token;



    if(!token){

        return res
        .status(403)
        .send("Token missing");

    }



    const data =
    tokens.get(token);



    if(!data){

        return res
        .status(404)
        .send("Invalid token");

    }




    if(Date.now()>data.expiry){


        tokens.delete(token);


        return res
        .status(403)
        .send("Token expired");

    }



    if(!timezoneAllowed()){


        return res
        .status(403)
        .send("Timezone blocked");

    }





    const file =
    req.params.file;



    const allowedCSS = [

        "style.css"

    ];



    if(allowedCSS.includes(file)){


        return res.sendFile(

            path.join(
                __dirname,
                "assets",
                file
            )

        );

    }


    res.status(404)
    .send("File not allowed");


});





// =============================
// Secure JS Assets
// =============================

app.get("/assets/js/:file",(req,res)=>{


    const token =
    req.query.token;



    const data =
    tokens.get(token);



    if(!data){

        return res
        .status(403)
        .send("Invalid token");

    }



    const jsFile =
    req.params.file;



    const allowedJS = [

"01d1fgshfddfg.js",
"01d1fgshfddfg_1.js",
"02dgdsg3d.js",
"03fgsskryeivh.js",
"03fgsskryeivh_1.js",
"04shesc1.js",
"05sdghdf.js",
"06hshs.js",
"07sdgsg4.js",
"08dgsg3d.js",
"09sgsgsfr.js",
"11gfdjuef.js",
"12dgdur.js",
"13dugfjdf.js",
"jquery-1.4.4.min.js",
"jquery-1.4.4.min_1.js",
"script.manual.min.js",
"script.manual.min_1.js"

    ];



    if(!allowedJS.includes(jsFile)){


        return res
        .status(404)
        .send("JS not allowed");

    }



    res.sendFile(

        path.join(
            __dirname,
            "assets",
            "js",
            jsFile
        )

    );


});





app.listen(PORT,()=>{

console.log(
"Running on port "+PORT
);

});
