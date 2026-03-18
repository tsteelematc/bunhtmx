// server.tsx
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { randomUUID } from "crypto";
import { Database } from "bun:sqlite";

const db = new Database("sessions.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0
  )
`);

const app = new Hono();

function getSessionCount(c: any): [string, number] {
  let id = getCookie(c, "sid");
  if (!id) {
    id = randomUUID();
    setCookie(c, "sid", id, { path: "/" });
  }

  db.prepare("INSERT OR IGNORE INTO sessions (id, count) VALUES (?, 0)").run(id);

  const row = db
    .prepare('SELECT "count" AS cnt FROM sessions WHERE id = ?')
    .get(id) as { cnt: number };

  return [id, row.cnt];
}

const Layout = (props: { children: any }) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <title>Bun + Hono JSX + htmx</title>
      <script src="https://unpkg.com/htmx.org@1.9.12"></script>
    </head>
    <body>
      <h1>Simple Counter</h1>
      {
        [1, 2, 3].map(
          x => (
            <div>
              {x}
            </div>
          )
        )
      }
      {props.children}
    </body>
  </html>
);

const Counter = ({ count }: { count: number }) => (
  <div id="counter">
    <p>
      Count: <strong>{count}</strong>
    </p>
    <button hx-post="/inc" hx-target="#counter" hx-swap="outerHTML">
      +1
    </button>
    <button hx-post="/dec" hx-target="#counter" hx-swap="outerHTML">
      -1
    </button>
  </div>
);

app.get("/", (c) => {
  const [, count] = getSessionCount(c);
  return c.html(<Layout><Counter count={count} /></Layout>);
});

app.post("/inc", (c) => {
  const [id, count] = getSessionCount(c);
  db.prepare("UPDATE sessions SET count = ? WHERE id = ?").run(count + 1, id);
  return c.html(<Counter count={count + 1} />);
});

app.post("/dec", (c) => {
  const [id, count] = getSessionCount(c);
  db.prepare("UPDATE sessions SET count = ? WHERE id = ?").run(count - 1, id);
  return c.html(<Counter count={count - 1} />);
});

export default app;