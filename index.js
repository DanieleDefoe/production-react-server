const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const jsonServer = require("json-server");
const path = require("node:path");
const cors = require("cors");
const https = require("node:https");

const options = {
  key: fsSync.readFileSync(path.resolve(__dirname, "key.pem")),
  cert: fsSync.readFileSync(path.resolve(__dirname, "cert.pem")),
};

const allowedOrigins = [
  "http://localhost:3000",
  "https://production-react-delta.vercel.app",
  "http://185.91.53.179",
  "https://185.91.53.179",
  "https://abuzar-production.ru",
];

const { PORT = 8443 } = process.env;

const dbPath = path.resolve(__dirname, "db.json");

const server = jsonServer.create();

const router = jsonServer.router(dbPath);

server.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

server.use(jsonServer.defaults({}));
server.use(jsonServer.bodyParser);

server.use(async (_, __, next) => {
  await new Promise((res) => setTimeout(res, 800));
  next();
});

server.use((req, _, next) => {
  if (req.method === "POST" && req.path === "/comments") {
    const timestamp = new Date().toISOString();
    req.body = { ...req.body, createdAt: timestamp };
  }
  next();
});

server.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = await fs.readFile(dbPath, "UTF-8");
    const data = JSON.parse(db);

    const { users = [] } = data;

    const userFromDB = users.find(
      (user) => user.username === username && user.password === password
    );

    if (userFromDB) {
      return res.json(userFromDB);
    }

    return res.status(403).send("Invalid credentials");
  } catch (e) {
    return res.status(500).send(e.message);
  }
});

server.get("/test", (_, res) => {
  return res
    .status(200)
    .send("CI / CD IS FUCKING WORKING AT LAST! IT IS FIXED AGAIN NOW!!!!");
});

server.use(router);

const httpsServer = https.createServer(options, server);

httpsServer.listen(PORT);
