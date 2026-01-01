import express from 'express';
import globalErrorHandler from './controller/error';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import authRouter from './routes/auth';
import workspaceRouter from './routes/workspace';
import projectRouter from './routes/project';
import taskRouter from './routes/task';
import cors from "cors"
import messageRouter from './routes/message';

console.log('frontend url',process.env.FRONTEND_URL)
const app = express();

app.use(helmet());

//Req Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}


app.use(cors({
  origin:  [
    "http://localhost:3000",
    "http://192.168.101.17:3000"
  ],
  credentials: true,
}));

//Limit req from same IP
// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000,
//   message: "Too many requests from this IP, please try again in an hour!",
// });
// app.use("/api", limiter);

//Body parser, reading from body to req.body
app.use(express.json());

app.use(express.urlencoded({ extended: true }));



//cookie parser
app.use(cookieParser());

//Data sanitization against NOSQL query injection
// app.use(mongoSanitize());

//Data sanitization against XSS attacks
// app.use(xss());

//Prevent parameter pollution
app.use(hpp());

//Serving static files
app.use(express.static(`${__dirname}/public`));

app.get("/", (req, res) => {
  res.send("Hello World!!");
})

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/workspace", workspaceRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/task", taskRouter);
app.use("/api/v1/message", messageRouter);




app.use(globalErrorHandler);

export default app;



