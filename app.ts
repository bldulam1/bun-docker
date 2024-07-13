const PORT: number = +(process.env.PORT || 8081);
const NODE_ENV = process.env.NODE_ENV ?? "development";

type RequestHandler = (req: Request) => Response | Promise<Response>;

type ServerParams = {
  userId: string;
  topic: string;
};

const messages: Map<string, { userId: string; message: string }[]> = new Map();

const server = Bun.serve<ServerParams>({
  port: PORT,
  async fetch(req) {
    const id = req.headers.get("x-nom-user");

    // Handle unauthenticated requests
    // if (!id) {
    //   return new Response("Invalid Request", { status: 401 });
    // }

    // Handle websocket upgrades
    const url = new URL(req.url);
    if (
      server.upgrade(req, {
        data: { userId: id, topic: url.searchParams.get("topic") },
      })
    ) {
      // do not return a Response
      return;
    }

    // Handle authenticated requests
    const path = new URL(req.url).pathname;
    console.log(path);

    return new Response("Welcome to Bun!");
  },
  websocket: {
    async message(ws, message) {
      const parsed = JSON.parse(message.toString());
      ws.publish(parsed.group, parsed.message);
      ws.subscribe(parsed.group);
      // console.log("Message from", ws.data.userId, parsed);
    },
    async open(ws) {
      ws.subscribe(ws.data.topic);
      const histMessages = messages.get(ws.data.topic);
      if (histMessages) {
        ws.send(JSON.stringify(histMessages));
      }
    },
  },
});

console.log(`[${NODE_ENV}] Serving http://localhost:${server.port}`);
