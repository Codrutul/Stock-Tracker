const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Sample API route
app.get("/api/message", (req, res) => {
    res.send("Welcome to the backend!");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


