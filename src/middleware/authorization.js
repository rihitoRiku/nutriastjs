import express from "express";
import cookieParser from "cookie-parser";
import jwt from 'jsonwebtoken';

const app = express();

app.use(cookieParser());

function authorization (req, res, next) {
  const token = req.cookies.access_token;
  if (!token) {
    return res.sendStatus(403);
  }
  try {
    const data = jwt.verify(token, "YOUR_SECRET_KEY");
    req.userId = data.id;
    req.userRole = data.role;
    return next();
  } catch {
    return res.sendStatus(403);
  }
};

export default authorization;