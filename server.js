const express = require("express");
const dotenv = require("dotenv").config();
const path = require("path");
const PORT = process.env.PORT || 5000;
const URI =
  process.env.NODE_ENV === "development"
    ? process.env.DATABASE_LOCAL
    : process.env.DATABASE;
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const errorHandler = require("./middlewares/errorMiddleware");

//ROUTERS
const userRouter = require("./routes/userRoutes");
const productRouter = require("./routes/productRoutes");
const contactRouter = require("./routes/contactRoute");

//EXPRESS SERVER
const app = express();

//MIDDLEWARES
app.use((req, res, next) => {
  res.requestTime = new Date().toISOString();
  next();
});
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//SETUP CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://pinvent-app-akjesus.vercel.app",
      "http://192.168.0.110",
    ],
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//ROUTES
app.get("/", (req, res) => {
  return res
    .status(200)
    .send({ success: true, statusCode: 200, message: "Home Route!" });
});
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/contact-us", contactRouter);

app.all("*", (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  return res.status(404).send({
    success: false,
    statusCode: 404,
    message: `Can not ${req.method}-${fullUrl} on this server`,
  });
});
//ERROR MIDDLEWARE
app.use(errorHandler);
//CONNECT DB
mongoose
  .connect(URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((e) => {
    console.log(e);
  });
