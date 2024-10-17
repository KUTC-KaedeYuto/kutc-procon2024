const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("proconApi", {
  getProblem: () => ipcRenderer.send("getProblem"),
  onProblemRespond: (callback) => ipcRenderer.on("responseProblem", (_event, value) => callback(value)),

  submitAnswer: (data) => ipcRenderer.send("submitAnswer", data),
  onAnswerRespond: (callback) => ipcRenderer.on("responseAnswer", (_event, value) => callback(value))
});

contextBridge.exposeInMainWorld("fileApi", {
  write: (f_name, data) => ipcRenderer.send("writeFile", f_name, data),
  read: (id, f_name) => ipcRenderer.send("readFile", id, f_name),
  receive: (callback) => ipcRenderer.on("responseReadFile", (_event, id, value) => callback(id, value))
});