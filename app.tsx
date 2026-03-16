// server.tsx
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { randomUUID } from "crypto";

const app = new Hono();
const sessions = new Map<string, number>();

function getSessionCount(c: any): [string, number] {
  let id = getCookie(c, "sid");
  if (!id || !sessions.has(id)) {
    id = randomUUID();
    sessions.set(id, 0);
    setCookie(c, "sid", id);
  }
  return [id, sessions.get(id)!];
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
  sessions.set(id, count + 1);
  return c.html(<Counter count={count + 1} />);
});

app.post("/dec", (c) => {
  const [id, count] = getSessionCount(c);
  sessions.set(id, count - 1);
  return c.html(<Counter count={count - 1} />);
});

export default app;