import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.adminId = decoded.admin ? decoded.id : null;
    req.isAdminUser = decoded.admin || false;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};
