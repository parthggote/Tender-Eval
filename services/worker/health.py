"""Minimal health check server for Render's port binding requirement."""
import socket

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(('', 8001))
server.listen(1)

while True:
    conn, _ = server.accept()
    conn.sendall(b'HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK')
    conn.close()
