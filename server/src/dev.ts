// Local dev server: same router as the Vercel function, served with Express.
import express from 'express';
import { handle } from './http';

const PORT = Number(process.env.PORT) || 3001;
const app = express();
app.use(express.json());

app.all('/api/{*splat}', async (req, res) => {
  const out = await handle({
    method: req.method,
    path: req.path.replace(/^\/api/, ''),
    query: req.query as Record<string, string | undefined>,
    body: req.body,
  });
  res.status(out.status).json(out.body);
});

app.listen(PORT, () => console.log(`api dev server on http://localhost:${PORT}`));
