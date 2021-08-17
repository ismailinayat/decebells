import express from 'express';
import cookieParser from 'cookie-parser';
import globalErrorHandler from './controllers/errorController.js';
import AppError from './utils/appError.js';
import userRouter from './routes/userRoutes.js';
import productRouter from './routes/productRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
//import cors from 'cors';


const app = express()

//app.use(cors({origin: true, credentials: true}));
//{origin: true, credentials: true })

app.use(express.static(`${process.cwd()}/public`))
app.use(express.json())
app.use(cookieParser())



app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {

   next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler)

export default app;
