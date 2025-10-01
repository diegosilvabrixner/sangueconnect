import sqlite3
from werkzeug.security import generate_password_hash

# Conecta ao banco
conn = sqlite3.connect('sangueconnect.db')
cursor = conn.cursor()

print("Criando tabela 'usuarios'...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL
    )
''')

# Usuário de teste
cursor.execute("SELECT * FROM usuarios WHERE email = ?", ('teste@exemplo.com',))
if cursor.fetchone() is None:
    print("Inserindo usuário de teste...")
    senha_hash = generate_password_hash('senha123')
    cursor.execute("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
                   ('Usuário Teste', 'teste@exemplo.com', senha_hash))
    print("Usuário inserido!")
else:
    print("Usuário de teste já existe.")

conn.commit()
conn.close()
print("Banco de dados configurado.")
