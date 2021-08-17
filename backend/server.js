import dotenv from 'dotenv';
import connectDB from './utils/db.js'

dotenv.config()
import app from './app.js'

process.on('uncaughtException', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

connectDB()

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}...`)
})

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! 💥 Shutting down...')
  server.close(() => {
    process.exit(1)
  });
});
