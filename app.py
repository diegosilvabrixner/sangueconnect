import sqlite3
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from datetime import datetime, timedelta, date

app = Flask(__name__)
app.secret_key = 'AIzaSyD7mFoPWHpkDFAvF_gdJhisaEXgKNNApPM' # Lembre-se de trocar por uma chave mais segura em produção
DB_PATH = 'sangueconnect.db'

# --- FUNÇÕES DE BANCO DE DADOS E SETUP ---

def criar_tabelas():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT, email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL, sexo TEXT NOT NULL 
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agendamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, local TEXT NOT NULL,
            data TEXT NOT NULL, hora TEXT NOT NULL, data_agendamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS doacoes_registradas (
            id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, local TEXT NOT NULL,
            data TEXT NOT NULL, data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS campanhas (
            id INTEGER PRIMARY KEY AUTOINCREMENT, criador_id INTEGER NOT NULL, nome_campanha TEXT NOT NULL,
            cep TEXT, cidade TEXT, bairro TEXT, data_inicio TEXT NOT NULL, data_fim TEXT NOT NULL,
            descricao TEXT, tipo TEXT NOT NULL, data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (criador_id) REFERENCES usuarios (id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS participacoes_campanha (
            id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, campanha_id INTEGER NOT NULL,
            data_agendamento TEXT, hora_agendamento TEXT,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
            FOREIGN KEY (campanha_id) REFERENCES campanhas (id),
            UNIQUE(usuario_id, campanha_id)
        )
    ''')
    conn.commit()
    conn.close()

def buscar_usuario_por_email(email):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, email, senha, sexo FROM usuarios WHERE email = ?", (email,))
    usuario = cursor.fetchone()
    conn.close()
    return usuario

def buscar_usuario_por_id(user_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, email, sexo FROM usuarios WHERE id = ?", (user_id,))
    usuario = cursor.fetchone()
    conn.close()
    return usuario

def inserir_usuario(nome, email, senha, sexo):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        senha_hash = generate_password_hash(senha)
        cursor.execute("INSERT INTO usuarios (nome, email, senha, sexo) VALUES (?, ?, ?, ?)", (nome, email, senha_hash, sexo))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def atualizar_usuario(user_id, nome, email, sexo):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("UPDATE usuarios SET nome = ?, email = ?, sexo = ? WHERE id = ?", (nome, email, sexo, user_id))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        app.logger.error(f"Erro ao atualizar usuário: {e}")
        return False

criar_tabelas()

# --- DECORATORS E FUNÇÕES AUXILIARES ---

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

def calcular_status_doacao(usuario_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT sexo FROM usuarios WHERE id = ?", (usuario_id,))
    resultado_sexo = cursor.fetchone()
    if not resultado_sexo:
        conn.close()
        return "Erro", "Usuário não encontrado"
    sexo = resultado_sexo[0]
    cursor.execute("SELECT data FROM doacoes_registradas WHERE usuario_id = ? ORDER BY data DESC LIMIT 1", (usuario_id,))
    resultado_doacao = cursor.fetchone()
    conn.close()
    if not resultado_doacao or not resultado_doacao[0]:
        return "Posso doar em:", "Sem doação registrada"
    ultima_doacao_str = resultado_doacao[0]
    ultima_doacao_data = datetime.strptime(ultima_doacao_str, '%Y-%m-%d')
    intervalo_dias = 90 if sexo == 'Feminino' else 60
    hoje = datetime.now()
    proxima_data_doacao = ultima_doacao_data + timedelta(days=intervalo_dias)
    if hoje >= proxima_data_doacao:
        return "Posso doar em:", "Já pode doar!"
    else:
        dias_restantes = (proxima_data_doacao - hoje).days + 1
        return "Posso doar em:", f"{dias_restantes} DIAS"
# --- ROTAS PARA CANCELAR E EXCLUIR DOAÇÕES (DELETE) ---

@app.route('/cancelar_agendamento/<int:id>', methods=['DELETE'])
@login_required
def cancelar_agendamento(id):
    # Pega o ID do usuário logado para garantir que ele só pode cancelar seus próprios agendamentos
    usuario_id = session.get('user_id')
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Executa o DELETE, garantindo que o ID do agendamento e do usuário correspondem
        cursor.execute(
            "DELETE FROM agendamentos WHERE id = ? AND usuario_id = ?",
            (id, usuario_id)
        )
        conn.commit()
        
        # Verifica se alguma linha foi de fato apagada
        if cursor.rowcount > 0:
            conn.close()
            return jsonify({'sucesso': True, 'mensagem': 'Agendamento cancelado com sucesso!'})
        else:
            # Se rowcount for 0, o agendamento não foi encontrado ou não pertencia ao usuário
            conn.close()
            return jsonify({'sucesso': False, 'mensagem': 'Agendamento não encontrado ou não autorizado.'}), 404

    except Exception as e:
        app.logger.error(f"Erro ao cancelar agendamento: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'Erro interno no servidor.'}), 500


@app.route('/excluir_registro/<int:id>', methods=['DELETE'])
@login_required
def excluir_registro(id):
    # Mesma lógica de segurança: verifica o usuário logado
    usuario_id = session.get('user_id')
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Deleta da tabela de doações registradas
        cursor.execute(
            "DELETE FROM doacoes_registradas WHERE id = ? AND usuario_id = ?",
            (id, usuario_id)
        )
        conn.commit()
        
        if cursor.rowcount > 0:
            conn.close()
            return jsonify({'sucesso': True, 'mensagem': 'Registro excluído com sucesso!'})
        else:
            conn.close()
            return jsonify({'sucesso': False, 'mensagem': 'Registro não encontrado ou não autorizado.'}), 404

    except Exception as e:
        app.logger.error(f"Erro ao excluir registro: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'Erro interno no servidor.'}), 500

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('home'))
    return render_template('index.html')

@app.route('/home')
@login_required
def home():
    usuario_id = session.get('user_id')
    titulo_doacao, status_doacao = calcular_status_doacao(usuario_id)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    hoje = date.today().isoformat()
    cursor.execute('''
        SELECT c.*, u.nome as nome_criador,
               (SELECT COUNT(p.id) FROM participacoes_campanha p WHERE p.campanha_id = c.id) as participantes,
               (SELECT COUNT(p.id) FROM participacoes_campanha p WHERE p.campanha_id = c.id AND p.usuario_id = ?) as ja_participa
        FROM campanhas c
        JOIN usuarios u ON c.criador_id = u.id
        WHERE c.data_fim >= ?
        ORDER BY c.data_inicio ASC
    ''', (usuario_id, hoje))
    campanhas_futuras = cursor.fetchall()
    conn.close()
    return render_template('home.html', 
                           titulo_doacao=titulo_doacao, 
                           status_doacao=status_doacao, 
                           campanhas_futuras=campanhas_futuras)

@app.route('/participar_campanha/<int:campanha_id>')
@login_required
def participar_campanha(campanha_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM campanhas WHERE id = ?", (campanha_id,))
    campanha = cursor.fetchone()
    conn.close()
    if not campanha:
        return "Campanha não encontrada", 404
    return render_template('participar_campanha.html', campanha=campanha)

@app.route('/cadastro')
def cadastro():
    return render_template('cadastro.html')

@app.route('/agendar_doacao')
@login_required
def agendar_doacao():
    return render_template('agendar_doacao.html')

@app.route('/registrar_doacao')
@login_required
def registrar_doacao():
    return render_template('registrar_doacao.html')

@app.route('/minhas_doacoes')
@login_required
def minhas_doacoes():
    usuario_id = session.get('user_id')
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, local, data, hora FROM agendamentos WHERE usuario_id = ? ORDER BY data ASC", (usuario_id,))
    agendamentos = cursor.fetchall()
    cursor.execute("SELECT id, local, data FROM doacoes_registradas WHERE usuario_id = ? ORDER BY data DESC", (usuario_id,))
    registros = cursor.fetchall()
    conn.close()
    return render_template('minhas_doacoes.html', agendamentos=agendamentos, registros=registros)

@app.route('/perfil')
@login_required
def perfil():
    user_id = session.get('user_id')
    usuario_info = buscar_usuario_por_id(user_id)
    if not usuario_info:
        session.clear()
        return redirect(url_for('index'))
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(data) FROM doacoes_registradas WHERE usuario_id = ?", (user_id,))
    ultima_doacao = cursor.fetchone()[0]
    conn.close()
    return render_template('perfil.html', usuario_info=usuario_info, ultima_doacao=ultima_doacao)

@app.route('/editar_conta')
@login_required
def editar_conta():
    user_id = session.get('user_id')
    usuario_info = buscar_usuario_por_id(user_id)
    return render_template('editar_conta.html', usuario_info=usuario_info)

@app.route('/mapa')
@login_required
def mapa():
    return render_template('mapa.html')

@app.route('/termos')
def termos():
    return render_template('termos.html')

@app.route('/privacidade')
def privacidade():
    return render_template('privacidade.html')

@app.route('/remember')
def remember():
    return render_template('remember.html')

@app.route('/criar_campanha')
@login_required
def criar_campanha():
    return render_template('criar_campanha.html')

@app.route('/quiz')
@login_required
def quiz():
    return render_template('quiz.html')

@app.route('/posso_doar')
@login_required
def posso_doar():
    return render_template('posso_doar.html')

# --- ROTAS DE PROCESSAMENTO DE DADOS (POST) ---

@app.route('/cadastrar_usuario', methods=['POST'])
def cadastrar_usuario():
    dados = request.get_json() or {}
    nome = (dados.get('nome') or '').strip()
    email = (dados.get('email') or '').strip()
    senha = dados.get('senha') or ''
    sexo = dados.get('sexo')
    if not all([nome, email, senha, sexo]):
        return jsonify({'sucesso': False, 'mensagem': 'Todos os campos são obrigatórios.'}), 400
    if buscar_usuario_por_email(email):
        return jsonify({'sucesso': False, 'mensagem': 'E-mail já cadastrado.'}), 400
    if inserir_usuario(nome, email, senha, sexo):
        return jsonify({'sucesso': True})
    else:
        return jsonify({'sucesso': False, 'mensagem': 'Erro ao cadastrar usuário.'}), 500

@app.route('/verificar_login', methods=['POST'])
def verificar_login():
    dados = request.get_json() or {}
    email = (dados.get('email') or '').strip()
    senha_digitada = dados.get('senha') or ''
    if not email or not senha_digitada:
        return jsonify({'sucesso': False, 'mensagem': 'Email e senha são obrigatórios.'}), 400
    usuario = buscar_usuario_por_email(email)
    if not usuario or not check_password_hash(usuario['senha'], senha_digitada):
        return jsonify({'sucesso': False, 'mensagem': 'Email ou senha inválidos.'}), 401
    session['user_id'] = usuario['id']
    session['user_name'] = usuario['nome']
    return jsonify({'sucesso': True})

@app.route('/salvar_campanha', methods=['POST'])
@login_required
def salvar_campanha():
    criador_id = session.get('user_id')
    dados = request.get_json()
    if not all(k in dados for k in ['nome_campanha', 'data_inicio', 'data_fim', 'tipo', 'cidade']):
        return jsonify({'sucesso': False, 'mensagem': 'Campos obrigatórios não preenchidos.'}), 400
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO campanhas (criador_id, nome_campanha, cep, cidade, bairro, data_inicio, data_fim, descricao, tipo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (criador_id, dados['nome_campanha'], dados.get('cep'), dados.get('cidade'), dados.get('bairro'), 
              dados['data_inicio'], dados['data_fim'], dados.get('descricao'), dados['tipo']))
        conn.commit()
        conn.close()
        return jsonify({'sucesso': True, 'mensagem': 'Campanha criada com sucesso!'})
    except Exception as e:
        app.logger.error(f"Erro ao salvar campanha: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'Erro interno ao salvar a campanha.'}), 500

@app.route('/salvar_participacao/<int:campanha_id>', methods=['POST'])
@login_required
def salvar_participacao(campanha_id):
    usuario_id = session.get('user_id')
    dados = request.get_json()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO agendamentos (usuario_id, local, data, hora) VALUES (?, ?, ?, ?)", 
                       (usuario_id, dados['local'], dados['data'], dados['hora']))
        cursor.execute("INSERT INTO participacoes_campanha (usuario_id, campanha_id, data_agendamento, hora_agendamento) VALUES (?, ?, ?, ?)",
                       (usuario_id, campanha_id, dados['data'], dados['hora']))
        conn.commit()
        conn.close()
        return jsonify({'sucesso': True, 'mensagem': 'Participação confirmada com sucesso!'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'sucesso': False, 'mensagem': 'Você já está participando desta campanha.'}), 409
    except Exception as e:
        conn.close()
        app.logger.error(f"Erro ao salvar participação: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'Erro ao registrar participação.'}), 500

# --- ROTAS CORRIGIDAS E ADICIONADAS ---

@app.route('/salvar_agendamento', methods=['POST'])
@login_required
def salvar_agendamento():
    usuario_id = session.get('user_id')
    try:
        dados = request.get_json()
        local = dados.get('local')
        data = dados.get('data')
        hora = dados.get('hora')
        if not all([local, data, hora]):
            return jsonify({'sucesso': False, 'mensagem': 'Todos os campos são obrigatórios.'}), 400
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO agendamentos (usuario_id, local, data, hora) VALUES (?, ?, ?, ?)",
            (usuario_id, local, data, hora)
        )
        conn.commit()
        conn.close()
        return jsonify({'sucesso': True})
    except Exception as e:
        app.logger.error(f"Erro ao salvar agendamento: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'Erro interno ao agendar doação.'}), 500

@app.route('/salvar_doacao_registrada', methods=['POST'])
@login_required
def salvar_doacao_registrada():
    usuario_id = session.get('user_id')
    try:
        dados = request.get_json()
        local = dados.get('local')
        data = dados.get('data')
        if not all([local, data]):
            return jsonify({'sucesso': False, 'mensagem': 'Todos os campos são obrigatórios.'}), 400
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO doacoes_registradas (usuario_id, local, data) VALUES (?, ?, ?)",
            (usuario_id, local, data)
        )
        conn.commit()
        conn.close()
        return jsonify({'sucesso': True})
    except Exception as e:
        app.logger.error(f"Erro ao registrar doação: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'Erro interno ao registrar doação.'}), 500

@app.route('/atualizar_conta', methods=['POST'])
@login_required
def atualizar_conta():
    usuario_id = session.get('user_id')
    try:
        dados = request.get_json()
        nome = dados.get('nome')
        email = dados.get('email')
        sexo = dados.get('sexo')
        if not all([nome, email, sexo]):
            return jsonify({'sucesso': False, 'mensagem': 'Todos os campos são obrigatórios.'}), 400
        if atualizar_usuario(usuario_id, nome, email, sexo):
            session['user_name'] = nome
            return jsonify({'sucesso': True})
        else:
            return jsonify({'sucesso': False, 'mensagem': 'Não foi possível atualizar os dados.'}), 500
    except Exception as e:
        app.logger.error(f"Erro ao atualizar conta: {e}")
        return jsonify({'sucesso': False, 'mensagem': 'Erro interno ao atualizar a conta.'}), 500
        
# --- LOGOUT E INICIALIZAÇÃO ---

@app.route('/logout')
@login_required
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)