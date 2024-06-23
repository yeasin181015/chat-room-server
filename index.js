const express = require("express");
const connectDB = require("./db.js");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const PORT = 5000;

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/user", require("./Routes/auth_routes.js"));
app.use("/message", require("./Routes/message_routes.js"));
app.use("/conversation", require("./Routes/conversation_routes.js"));

// Server setup
const server = http.createServer(app);
// const expressServer = app.listen(PORT, () => {
//   console.log(`🚀 Server started at http://localhost:${PORT}`);
//   connectDB();
// })

// const io = new Server(expressServer, {
//   cors: {
//     origin: ["http://127.0.0.1:3000", "http://localhost:3000"]
//   }
// })

// Socket.io setup
// require("./socket.js")(server); // Initialize socket.io logic


// Start server and connect to database
server.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
  connectDB();
});
