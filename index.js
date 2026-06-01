const express = require("express");
const path = require("path");
const fs = require("fs");

// Creare foldere
const vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
for (let folder of vect_foldere) {
    let folderPath = path.join(__dirname, folder);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }
}

const app = express();
app.set("view engine", "ejs");

console.log("Folder index.js:", __dirname);
console.log("Folder curent (de lucru):", process.cwd());
console.log("Cale fisier:", __filename);

// Initializare Erori
let obGlobal = { obErori: null };

function initErori() {
    let rawdata = fs.readFileSync(path.join(__dirname, 'erori.json'));
    obGlobal.obErori = JSON.parse(rawdata);
    let info_erori = obGlobal.obErori.info_erori;
    let err_obj = {};
    for (let err of info_erori) {
        err.imagine = path.join(obGlobal.obErori.cale_baza, err.imagine);
        err_obj[err.identificator] = err;
    }
    obGlobal.obErori.eroare_default.imagine = path.join(obGlobal.obErori.cale_baza, obGlobal.obErori.eroare_default.imagine);
    obGlobal.obErori.info_erori = err_obj;
}

initErori();

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroare = obGlobal.obErori.info_erori[identificator];
    if (!eroare) {
        eroare = obGlobal.obErori.eroare_default;
    }
    
    let titluAfisare = titlu || eroare.titlu;
    let textAfisare = text || eroare.text;
    let imagineAfisare = imagine || eroare.imagine;

    res.status(eroare.status || 404).render("pagini/eroare", {
        titlu: titluAfisare,
        text: textAfisare,
        imagine: imagineAfisare
    });
}

// Configurare fisiere statice si 403 Forbidden
app.use('/resurse', express.static(path.join(__dirname, 'resurse')));

app.use('/resurse', function(req, res) {
    afisareEroare(res, 403);
});

// Favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'resurse/ico/favicon.ico'));
});

// Rute pagini de baza
app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pagini/index', { ip: req.ip || req.socket.remoteAddress });
});

// Interzice accesul direct la EJS
app.get(/\.ejs$/, (req, res) => {
    afisareEroare(res, 400);
});

// Ruta generala pentru orice pagina (trebuie sa fie ultima ruta get)
app.get('/:pagina', (req, res) => {
    let pagina = req.params.pagina;
    res.render('pagini/' + pagina, { ip: req.ip || req.socket.remoteAddress }, function(err, html) {
        if (err) {
            if (err.message.startsWith("Failed to lookup view")) {
                afisareEroare(res, 404);
            } else {
                afisareEroare(res, null, "Eroare de randare", err.message, null);
            }
        } else {
            res.send(html);
        }
    });
});

app.listen(8080);
console.log("Serverul a pornit pe portul 8080!");