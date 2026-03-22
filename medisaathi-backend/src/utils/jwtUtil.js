import jwt from 'jsonwebtoken';


export const signAccessToken = (user) => {
  return jwt.sign(
    {
      id:       user._id,
      role:     user.role,
      hospital: user.hospital ?? null,
      branch:   user.branch   ?? null,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};