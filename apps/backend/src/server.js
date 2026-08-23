require("dotenv").config();

const app = require("./app/app");

const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log("Server is Running on port 3000");
        });
    }
    catch(error) {
        process.exit(1);
    }
}

startServer();