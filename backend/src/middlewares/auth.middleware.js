import jwt from 'jsonwebtoken';

export const isLoggedIn = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token not Found',
      });
    }

    const decode = await jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth Middleware Decoded Token:', decode);

    req.user = decode;
    next();
  } catch (error) {
    return res.status(400).json({
      message: 'Middleware Failure',
      success: false,
    });
  }
};
