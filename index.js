const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const redis = require("redis");
const cors = require("cors");
const { MONGO_USER, MONGO_PASSWORD, MONGO_PORT, MONGO_IP, REDIS_URL, REDIS_PORT, SESSION_SECRET } = require("./config/config");

let redisStore = require("connect-redis")(session);
let redisClient = redis.createClient({
    legacyMode: true,
    socket: {
        port: REDIS_PORT,
        host: REDIS_URL
    }
});
redisClient.connect().catch(console.error);

const postRouter = require("./routes/postRoutes");
const userRouter = require("./routes/userRoutes");
const app = express();
const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;

const connectWithRetry = () => {
    mongoose
    .connect(mongoURL)
    .then(() => {
        console.log("Successfully connected to DB")
    })
    .catch((e) => {
        console.log(e);
        setTimeout(connectWithRetry, 5000);
    });
}

connectWithRetry();

app.enable("trust proxy");
app.use(cors({}));

app.use(session({
    store: new redisStore({client: redisClient}),
    secret: SESSION_SECRET,
    cookie: {
        secure: false,
        resave: false,
        saveUninitialized: false,
        httpOnly: true,
        maxAge: 30000
    }
}));

app.use(express.json());

app.get('/api/v1', (req, res) => {
    res.send("<h2>Yo to my API</h2>");
    console.log("RAN")
});
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`listening on port ${port}`))