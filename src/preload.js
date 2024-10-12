const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("proconApi", {
  getProblem: () => ipcRenderer.send("getProblem"),
  onProblemRespond: (callback) => ipcRenderer.on("responseProblem", (_event, value) => callback(value)),

  submitAnswer: (data) => ipcRenderer.send("submitAnswer", data),
  onAnswerRespond: (callback) => ipcRenderer.on("responseAnswer", (_event, value) => callback(value))
});