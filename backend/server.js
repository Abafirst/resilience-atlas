const app = express();

// ✅ API ROUTES FIRST (must come before static files!)
app.use('/auth', require('./routes/auth'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/payments', require('./routes/payments'));

// ✅ THEN static files
app.use(express.static(path.join(__dirname, '../client/dist')));

// ✅ CATCH-ALL ROUTE LAST (for React routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ... error handler ...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    serverReady = true;
    logger.info(`🚀 Server running on port ${PORT}`);
});
