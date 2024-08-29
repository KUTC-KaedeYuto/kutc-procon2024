const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("proconApi", {
    getProblem: () => ipcRenderer.send("getProblem"),
    onProblemRespond: (callback) => ipcRenderer.on("responseProblem", (_event, value) => callback(value))
});