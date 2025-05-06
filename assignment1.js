const express = require('express');
const session = require('express-session');
const port = process.env.PORT || 3000;
const app = express();

// Middleware code
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.get('/', (req, res) => {
    res.send('<a href="/signup">Sign Up</a><a href="/login">Login</a>');
});

// user%
app.get('/loggedin', (req, res) => {
    res.sender('loggedin');
});

app.get('/signup', (req, res) => {
    res.sender('signup');
});

app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;

    if (!name) {
        res.render('signupSubmit', { missingField: 'Name' });
    } else if (!email) {
        res.render('signupSubmit', { missingField: 'Email' });
    } else if (!password) {
        res.render('signupSubmit', { missingField: 'Password' });
    } else {
        res.send('Sign up successful!');
    }
});

app.get('/login', (req, res) => {
    res.sender('login');
});

app.post('/post', (req, res) => {
    const { email, password } = req.body;

if (!email) {
        res.render('loginSubmit', { missingField: 'Email' });
    } else if (!password) {
        res.render('loginSubmit', { missingField: 'Password' });
    } else {
        res.send('Login successful!');
    }
});

// user%
app.get('/members', (req, res) => {
    res.render('members');
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

app.get("*", (req, res) => {
    res.status(404);
    res.send("Page not found - 404");
});