// 拾词 Word Atlas · macOS 桌面壳（Electron）
// 打包好的买家版：双击即用，无需命令行、无需 dev 服务。
const { app, BrowserWindow, shell, session } = require("electron");
const path = require("node:path");
const { spawn } = require("node:child_process");

const isDev = !!process.env.WA_DEV;

// 渲染进程来自 file://，默认拿不到麦克风/录音权限；这里统一放行 media。
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    if (permission === "media" || permission === "mediaKeySystem" || permission === "notifications") {
      return callback(true);
    }
    callback(false);
  });
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#151a23",
    title: "拾词 Word Atlas",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5188/");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // 外链（GitHub/官网）用系统浏览器打开，别劫持进应用。
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// 启动时检查本地 Ollama 是否在跑，没跑时提示用户（不阻塞启动）。
app.whenReady().then(() => {
  const probe = spawn("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "1", "http://localhost:11434/api/tags"]);
  probe.on("close", (code) => {
    if (code !== 0) {
      // 首次使用且无 Ollama 时，在窗口加载完成后给一条轻提示即可；不弹原生对话框打扰。
      console.log("Ollama probe: offline");
    }
  });
});
