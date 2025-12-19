@echo off
echo Starting WL10 server...
start cmd /k "node server.js"

timeout /t 3

echo Starting ngrok...
start cmd /k "ngrok http 3000"
