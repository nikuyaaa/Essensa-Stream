async function testServer(name, url) {
  return new Promise((resolve) => {
    console.log(`\nTesting ${name}: ${url}`);
    const ws1 = new WebSocket(url);
    const ws2 = new WebSocket(url);
    let resolved = false;

    const cleanup = () => {
      ws1.close();
      ws2.close();
    };

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        console.log(`❌ ${name} failed (Timeout - messages not received)`);
        resolve(false);
      }
    }, 5000);

    ws1.addEventListener('open', () => {
      // Once both are open, send from ws1
      if (ws2.readyState === WebSocket.OPEN) {
        ws1.send(JSON.stringify({ test: "hello" }));
      }
    });

    ws2.addEventListener('open', () => {
      if (ws1.readyState === WebSocket.OPEN) {
        ws1.send(JSON.stringify({ test: "hello" }));
      }
    });

    ws2.addEventListener('message', (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.test === "hello") {
          resolved = true;
          clearTimeout(timeout);
          cleanup();
          console.log(`✅ ${name} works! Broadcast message received.`);
          resolve(true);
        }
      } catch (e) {
        // ignore
      }
    });

    ws1.addEventListener('error', (err) => {
      console.log(`Error on ws1 for ${name}`);
    });

    ws2.addEventListener('error', (err) => {
      console.log(`Error on ws2 for ${name}`);
    });
  });
}

async function runTests() {
  await testServer(
    "PieSocket Sandbox",
    "wss://free.piesocket.com/v3/essensa_stream_nikuyaaa?api_key=VC1IyPolUZiwEnffLJccNu4s7344qnvW66v7gGbb"
  );

  await testServer(
    "WebSocket.in Sandbox",
    "wss://connect.websocket.in/v3/essensa_stream_nikuyaaa?api_key=o7MmTYhmz4H4sT4G2EdTph240W593s99Ae4Tbbp4"
  );

  await testServer(
    "SocketsBay",
    "wss://socketsbay.com/wss/v2/1/demo/"
  );
}

runTests();
