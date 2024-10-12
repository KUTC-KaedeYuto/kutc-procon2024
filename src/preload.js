const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("proconApi", {
    getProblem: () => ipcRenderer.send("getProblem"),
    onProblemRespond: (callback) => ipcRenderer.on("responseProblem", (_event, value) => callback(value)),

    submitProblem: () => ipcRenderer.send("submitProblem"),
    onAnswerRespond: (callback) => ipcRenderer.on("responseAnswer", (_event, value) => callback(value))
});