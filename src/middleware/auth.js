const getProvidedKey = (req) => {
  const authorizationHeader = req.header('authorization') || '';
  return req.header('x-api-key') || authorizationHeader.replace(/^Bearer\s+/i, '');
};

const authenticateApiKey = (req, res, next) => {
  const adminKey = process.env.JOB_ADMIN_API_KEY || process.env.JOB_API_KEY;
  const readKey = process.env.JOB_READ_API_KEY || adminKey;

  if (!adminKey) {
    return next();
  }

  const providedApiKey = getProvidedKey(req);

  if (providedApiKey === adminKey) {
    req.authRole = 'admin';
    return next();
  }

  if (providedApiKey === readKey) {
    req.authRole = 'read';
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
};

const requireReadAccess = (req, res, next) => {
  if (req.authRole === 'admin' || req.authRole === 'read') {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
};

const requireWriteAccess = (req, res, next) => {
  if (req.authRole === 'admin') {
    return next();
  }

  return res.status(403).json({ error: 'Forbidden' });
};

module.exports = {
  authenticateApiKey,
  requireReadAccess,
  requireWriteAccess
};