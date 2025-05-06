require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const MongoStore = require('connect-mongo');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const port = process.env.PORT || 3000;
const app = express();
const Joi = require("joi");

const mongoURI = `mongodb+srv://${process.env.MONGODB_USER}` +`:${encodeURIComponent(process.env.MONGODB_PASSWORD)}` +
`@${process.env.MONGODB_HOST}` + `/${process.env.MONGODB_DATABASE}` + `?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(mongoURI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function start() {
    try {

        await client.connect();
        app.use(session({
            secret: process.env.NODE_SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            store: MongoStore.create({
                client,
                dbName: process.env.MONGODB_DATABASE,
                collectionName: 'sessions',
                crypto: { secret: process.env.MONGODB_SESSION_SECRET },
                ttl: 60 * 60,
            }),
            cookie: { maxAge: 3600000 }
        }));

        // Middleware code
        app.set('view engine', 'ejs');
        app.use(express.urlencoded({ extended: true }));
        app.use(express.static(path.join(__dirname, 'public')));
        app.use(express.json());
        app.set('views', path.join(__dirname, 'views'));

        app.get('/', (req, res) => {
            if (req.session.name) {
                return res.render('index', {
                    loggedInConfirmation: true,
                    name: req.session.name
                });
            }
            res.render('index', { loggedInConfirmation: false });
        });

        app.get('/signup', (req, res) => {
            res.render('signup');
        });

        app.post('/signupSubmit', async (req, res) => {
            const signupInfo = Joi.object({
                name: Joi.string().max(30).required(),
                email: Joi.string().email().required(),
                password: Joi.string().min(6).required()
            });

            try {
                const { error, value } = signupInfo.validate(req.body);
                if (error) {
                    return res.send(`<p>${error.message}</p><a href="/signup">Try again</a>`);
                }
                const { name, email, password } = value;
                const hash = await bcrypt.hash(password, 10);
                await client.db().collection('users')
                    .insertOne({ name, email, password: hash });
                req.session.name = name;
                res.redirect('/members');

            } catch (err) {
                console.error(err);
                res.status(500).send("Server error");
            }
        });

        app.get('/login', (req, res) => {
            res.render('login');
        });

        app.post('/loginSubmit', async (req, res) => {
            const loginInfo = Joi.object({
                email: Joi.string().email().required(),
                password: Joi.string().required()
            });

            const { error, value } = loginInfo.validate(req.body);
            if (error) {
                return res.send(`<p>${error.message}</p><a href="/login">Try again</a>`);
            }
            const { email, password } = value;

            try {
                const { email, password } = value;
                const user = await client.db().collection('users').findOne({ email });
                if (!user || !(await bcrypt.compare(password, user.password))) {
                    return res.send('<p>Invalid password</p><a href="/login">Try again</a>');
                }

                req.session.name = user.name;
                res.redirect('/members');
            } catch (err) {
                console.error(err);
                res.status(500).send("Server error");
            }
        });

        app.get('/members', (req, res) => {
            if (!req.session.name) {
                return res.redirect('/');
            }

            // Select one random image filename
            const images = ['beautiful_squidward.jpg', 'chicken_spongebob.webp', 'imagination.webp'];
            const randomImage = images[Math.floor(Math.random() * images.length)];

            // Render the members page with user name and random image
            res.render('members', {
                user: req.session.name,
                randomImage: randomImage
            });
        });

        // Adjust this
        app.get('/logout', (req, res) => {
            req.session.destroy(err => {
                if (err) {
                    console.log('Logout error:', err);
                    return res.status(500).send("Couldn't log you out");
                }
                res.redirect('/');
            });
        });

        app.use((req, res) => {
            res.status(404).send("Page not found - 404");
        });

        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    }
    catch (err) {
        console.error('Failed to start', err);
    }
}

start();