// This is our 'Global Error Handling Middleware

import AppError from './../utils/appError.js'

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}

const handleDuplicateFieldsErrorDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

    const message = `Duplicate field value: ${value}. Please use another value!`

    return new AppError(message, 400)
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data. ${errors.join('. ')}`

    return new AppError(message, 400)

}

const sendErrorDev = (err, res) => {                                // So if we are in development we want to get 'statusCode', 'status', 'message', 'error statck', and whole error as well.
    res.status(err.statusCode).json({
        status: err.status,
        error:err,
        message: err.message,
        stack: err.stack
});
}

const sendErrorProd = (err, res) => {                               // If we are in production we will first check if error has 'isOperational' property set to true or not. If it is true this means that
    // Operational, trusted error: send message to client           // we are already aware of the error and we will send the 'statusCode', 'status' and 'message' to the users.
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
    })
 }  else {
     // Programming or other unknown error: don't send the detail of the error to users

    console.error('ERROR 💥', err);
    
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong.'                            // If there is no 'isOperational' property attached to error then we don't want to send the error details and simply will send a generic
        })                                                          // message saying 'Something went wrong'
    }
}

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res)
        
    }   
    else if (process.env.NODE_ENV === 'production') {
        let error = {...err}

        if (error.name === 'CastError') error = handleCastErrorDB(error)
        if (error.code === 11000) error = handleDuplicateFieldsErrorDB(error)
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error)
        sendErrorProd(error, res)
    }
}

export default globalErrorHandler;
