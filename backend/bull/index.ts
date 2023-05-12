import express, {NextFunction, Request, Response} from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import "dotenv/config";

import brawler from "./routes/brawler";
import map from "./routes/map";
import event from "./routes/event";
import account from "./routes/account";
import collection from "./routes/collection";
import tradesview from "./routes/tradesview";
import tradesmodify from "./routes/tradesmodify";

const app = express();
let port = 6969;

if (typeof process.env["PORT"] != "undefined"){
    const portString = process.env["PORT"];
    if (!isNaN(+portString)){
        port = parseInt(portString);
    }
}

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));

app.use((req, res, next) => {
    (bodyParser.json())(req, res, (error) => {
        if (typeof error != "undefined"){
            res.status(400).send("Incorrectly formatted json.");
            return;
        }
        next();
    });
});

app.use("/image", express.static(path.join("assets", "images")));

app.use("/", brawler);
app.use("/", map);
app.use("/event", event);
app.use("/", account);
app.use("/", collection);
app.use("/trade", tradesview);
app.use("/trade", tradesmodify);

// Error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(error.stack);    
    next();
});

app.listen(port, () => console.log(port));