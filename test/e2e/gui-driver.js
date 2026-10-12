// Drives the SRM GUI over the DevTools protocol: reports console errors and
// exceptions, then runs the given async JS steps in the renderer.
const port = process.argv[2];
const steps = JSON.parse(require("fs").readFileSync(process.argv[3], "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  let page;
  for (let i = 0; i < 120 && !page; i++) {
    try {
      page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(
        (t) => t.type === "page",
      );
    } catch {}
    if (!page) await sleep(500);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const problems = [];
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result || msg.error);
      pending.delete(msg.id);
      return;
    }
    if (
      msg.method === "Runtime.consoleAPICalled" &&
      msg.params.type === "error"
    )
      problems.push(
        "console.error: " +
          msg.params.args
            .map((a) => a.value ?? a.description)
            .join(" ")
            .slice(0, 600),
      );
    if (msg.method === "Runtime.exceptionThrown")
      problems.push(
        "exception: " +
          (
            msg.params.exceptionDetails.exception?.description ||
            msg.params.exceptionDetails.text
          ).slice(0, 600),
      );
  };
  await new Promise((r) => (ws.onopen = r));
  await send("Runtime.enable");
  await sleep(6000);
  for (const step of steps) {
    const r = await send("Runtime.evaluate", {
      expression: `(async () => { ${step.js} })()`,
      awaitPromise: true,
      returnByValue: true,
      timeout: step.timeout || 120000,
    });
    const v = r.exceptionDetails
      ? "THREW " +
        (r.exceptionDetails.exception?.description || r.exceptionDetails.text)
      : JSON.stringify(r.result?.value);
    console.log(`[${step.name}]`, (v || "").slice(0, 1500));
  }
  console.log(
    "problems:",
    problems.length ? "\n  " + problems.join("\n  ") : "none",
  );
  process.exit(0);
})();
