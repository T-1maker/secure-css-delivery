const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// टोकन स्टोर करने के लिए (30 सेकंड की लाइफ)
const tokens = new Map();
const TOKEN_TIME = 30 * 1000;

// इमेजेस के लिए यूनिवर्सल पाथ
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/Images', express.static(path.join(__dirname, 'Images')));

// मुख्य पेज (index.html) को डायनामिक और हर बार यूनीक CSS नाम के साथ सर्व करना
app.get('/', (req, res) => {
    try {
        let htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        
        // 1. हर रिफ्रेश पर एक सुरक्षित क्रिप्टो टोकन बनाना
        const token = crypto.randomBytes(16).toString('hex');
        tokens.set(token, { expiry: Date.now() + TOKEN_TIME });
        
        // 2. हर बार CSS का चेहरा पूरी तरह बदल देना (जैसे css_a8f9d2.css)
        const uniqueCssName = 'css_' + crypto.randomBytes(4).toString('hex') + '.css';
        
        // HTML के अंदर असली CSS पाथ को इस यूनीक रैंडम पाथ और टोकन से लाइव बदल देना
        htmlContent = htmlContent.replace('css/style.css', `api/v1/assets/${uniqueCssName}?token=${token}`);
        
        // 3. जावास्क्रिप्ट लोडर के लिए भी टोकन इंजेक्ट करना
        htmlContent = htmlContent.replace('api/v1/secure-core.js', `api/v1/secure-core.js?token=${token}`);
        
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
    } catch (err) {
        res.status(500).send('HTML System Error');
    }
});

// हर बार बदलने वाले यूनीक CSS को वैलिडेट करके सर्व करने वाला एंडपॉइंट
app.get('/api/v1/assets/css_*.css', (req, res) => {
    const token = req.query.token;
    if (!token || !tokens.has(token)) {
        return res.status(403).send('Access Denied: Invalid or Missing Token');
    }

    try {
        const cssPath = path.join(__dirname, 'css', 'style.css');
        if (fs.existsSync(cssPath)) {
            let cssCode = fs.readFileSync(cssPath, 'utf8');
            res.setHeader('Content-Type', 'text/css');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.send(cssCode);
        } else {
            res.status(404).send('Not Found');
        }
    } catch (e) {
        res.status(500).send('Error');
    }
});

// 18 JS फाइलों को सुरक्षित कंबाइन करके सिंगल एंडपॉइंट पर भेजने वाला टोकन गेटवे
app.get('/api/v1/secure-core.js', (req, res) => {
    const token = req.query.token;
    if (!token || !tokens.has(token)) {
        return res.status(403).send('Access Denied: Invalid or Missing Token');
    }

    try {
        const jsFiles = [
            "js/jquery-1.4.4.min.js", "js/jquery-1.4.4.min_1.js",
            "js/01d1fgshfddfg.js", "js/01d1fgshfddfg_1.js", "js/02dgdsg3d.js",
            "js/03fgsskryeivh.js", "js/03fgsskryeivh_1.js", "js/04shesc1.js",
            "js/05sdghdf.js", "js/06hshs.js", "js/07sdgsg4.js", "js/08dgsg3d.js",
            "js/09sgsgsfr.js", "js/11gfdjuef.js", "js/12dgdur.js", "js/13dugfjdf.js",
            "js/script.manual.min.js", "js/script.manual.min_1.js"
        ];

        let combinedCode = '';
        jsFiles.forEach(file => {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                combinedCode += fs.readFileSync(filePath, 'utf8') + '\n';
            }
        });

        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.send(combinedCode);
    } catch (error) {
        res.status(500).send('// Internal Server Error');
    }
});

// हर 1 मिनट में एक्सपायर हो चुके टोकन्स को मेमोरी से साफ़ करने का टाइमर
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of tokens.entries()) {
        if (now > data.expiry) tokens.delete(token);
    }
}, 60 * 1000);

app.listen(PORT, () => {
    console.log(`🔥 अल्ट्रा-सिक्योर टोकन सर्वर पोर्ट ${PORT} पर चालू है!`);
});
