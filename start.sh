#!/bin/bash
cd "$(dirname "$0")"
PID=$(lsof -ti:3000 2>/dev/null)
if [ -n "$PID" ]; then
  echo "Servidor já rodando em http://localhost:3000/ (PID $PID)"
  exit 0
fi
nohup node server.js > /tmp/server.log 2>&1 &
sleep 1
if curl -s http://127.0.0.1:3000/ > /dev/null 2>&1; then
  echo "Servidor iniciado: http://localhost:3000/"
else
  echo "Falha ao iniciar. Veja /tmp/server.log"
fi
