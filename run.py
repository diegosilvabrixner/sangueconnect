from waitress import serve
# Importe a sua variável 'app' do seu arquivo principal
# Se seu arquivo se chama 'meusite.py', seria 'from meusite import app'
from app import app 

if __name__ == '__main__':
    print("Servidor iniciando em http://localhost:8000")
    serve(app, host='0.0.0.0', port=8000)