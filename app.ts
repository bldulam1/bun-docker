const PORT: number = +(process.env.PORT || 8081);
const NODE_ENV = process.env.NODE_ENV ?? "development";

type RequestHandler = (req: Request) => Response | Promise<Response>;

type ServerParams = {
  userId: string;
};

const messages: Map<string, { userId: string; message: string }[]> = new Map();

const server = Bun.serve<ServerParams>({
  port: PORT,
  async fetch(req) {
    const userId = req.headers.get("x-nom-user");
    if (!userId) return new Response("Unauthorized access", { status: 401 });

    const isUpgraded = server.upgrade(req, { data: { userId } });
    if (isUpgraded) {
      // do not return a Response
      return;
    }

    return new Response("Welcome to Bun!");
  },
  websocket: {
    async message(ws, message) {
      const data = JSON.parse(message.toString());
      if (data?.header?.type === "order" && data?.body) {
        const payload = JSON.stringify({ ...data.body, time: Date.now() });
        ws.publishText(Topics.Orders, payload);
      }
    },
    async open(ws) {
      ws.subscribe(Topics.Orders);
    },
  },
});

enum Topics {
  Orders = "orders",
}

console.log(
  `${Date.now()} [${NODE_ENV}] Serving http://localhost:${server.port}`
);
