import sqlite3

# conecta no banco
conn = sqlite3.connect("SangueConnect.db")
cursor = conn.cursor()

# pega todos os usuários cadastrados
cursor.execute("SELECT * FROM usuarios")
usuarios = cursor.fetchall()

# exibe no terminal
print("ID | Nome | Email | Senha")
print("-" * 40)
for usuario in usuarios:
    print(usuario)

conn.close()
