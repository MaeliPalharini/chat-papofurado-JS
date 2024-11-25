const BASE_URL = 'http://localhost:3000';

const ENDPOINTS = {
    MENSAGENS: `${BASE_URL}/messages`,
    PARTICIPANTES: `${BASE_URL}/participants`,
    STATUS: `${BASE_URL}/status`,
};

const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
};

let nomeParticipante = '';
let atualizacaoMensagensIntervalo;
let destinatario = "Todos"; // Valor padrão

// Função principal de login
async function telaLogin(event) {
    event.preventDefault();

    const nome = document.querySelector('input[name="nome"]').value;

    if (nome) {
        try {
            await adicionarParticipante(nome);
            nomeParticipante = nome;

            exibirChat();
            iniciarAtualizacoes();
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            alert('Erro ao entrar no chat. Verifique sua conexão.');
        }
    } else {
        alert('Por favor, insira um nome válido.');
    }
}

// Função para adicionar participante na API
async function adicionarParticipante(nome) {
    try {
        const response = await fetch(ENDPOINTS.PARTICIPANTES, {
            method: 'POST',
            headers: DEFAULT_HEADERS,
            body: JSON.stringify({ name: nome }),
        });

        if (response.status === 201) {
            console.log('Participante adicionado com sucesso');
        } else {
            throw new Error(`Erro ao adicionar participante: ${response.status}`);
        }
    } catch (error) {
        throw error;
    }
}

// Exibe o chat após login
function exibirChat() {
    document.getElementById('tela-inicial').style.display = 'none';
    document.getElementById('bate-papo').style.display = 'flex';

    const statusDestinatario = document.getElementById('status-destinatario');
    statusDestinatario.textContent = `Conversando com: ${destinatario}`;
}

// Função para obter mensagens da API
async function obterMensagens() {
    try {
        const url = `${ENDPOINTS.MENSAGENS}?limit=50`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                ...DEFAULT_HEADERS,
                'user': nomeParticipante,
            },
        });

        if (response.status === 200) {
            const mensagens = await response.json();
            atualizarChat(mensagens);
        } else {
            console.error(`Erro ao obter mensagens: ${response.status}`);
        }
    } catch (error) {
        console.error('Erro ao obter mensagens:', error);
    }
}

// Atualiza o chat com mensagens
function atualizarChat(mensagens) {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = '';

    mensagens.forEach((mensagem) => {
        const mensagemElemento = document.createElement('div');
        mensagemElemento.classList.add('mensagem');

        const horario = document.createElement('div');
        horario.classList.add('mensagem-horario');
        horario.textContent = `(${mensagem.time})`;

        const texto = document.createElement('div');
        texto.classList.add('mensagem-texto');
        texto.innerHTML = `<strong>${mensagem.from}</strong> para <strong>${mensagem.to}</strong>: ${mensagem.text}`;

        mensagemElemento.appendChild(horario);
        mensagemElemento.appendChild(texto);

        chatContainer.appendChild(mensagemElemento);
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Função para obter a lista de participantes
async function obterParticipantes() {
    try {
        const response = await fetch(ENDPOINTS.PARTICIPANTES, {
            method: 'GET',
            headers: DEFAULT_HEADERS,
        });

        if (response.status === 200) {
            const participantes = await response.json();
            atualizarListaParticipantes(participantes);
        } else {
            console.error(`Erro ao obter participantes: ${response.status}`);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}

// Atualiza a lista de participantes no menu
function atualizarListaParticipantes(participantes) {
    const lista = document.getElementById('lista-participantes');
    lista.innerHTML = '';

    const todosItem = document.createElement('li');
    todosItem.innerHTML = `
        <img src="assets/publico.png" alt="Público" style="width: 40px; margin-right: 60px;">
        Todos
    `;
    if (destinatario === 'Todos') {
        todosItem.classList.add('selecionado');
    }
    lista.appendChild(todosItem);

    participantes.forEach((participante) => {
        const item = document.createElement('li');
        item.innerHTML = `
            <img src="assets/privada.png" alt="Privada" style="width: 40px; margin-right: 60px;">
            ${participante.name}
        `;
        if (participante.name === destinatario) {
            item.classList.add('selecionado');
        }
        lista.appendChild(item);
    });

    configurarSelecaoParticipantes();
}

// Configura seleção de participantes
function configurarSelecaoParticipantes() {
    const lista = document.getElementById('lista-participantes');

    lista.addEventListener('click', (event) => {
        if (event.target.tagName === 'LI' || event.target.tagName === 'IMG') {
            const itemSelecionado = event.target.tagName === 'IMG' ? event.target.parentElement : event.target;

            const itens = lista.querySelectorAll('li');
            itens.forEach((item) => item.classList.remove('selecionado'));

            itemSelecionado.classList.add('selecionado');
            destinatario = itemSelecionado.textContent.trim();

            const statusDestinatario = document.getElementById('status-destinatario');
            if (destinatario === 'Todos') {
                statusDestinatario.textContent = 'Conversando com: Todos (público)';
            } else {
                statusDestinatario.textContent = `Conversando com: ${destinatario} (privado)`;
            }
        }
    });
}

// Inicializa atualizações
function iniciarAtualizacoes() {
    if (atualizacaoMensagensIntervalo) {
        clearInterval(atualizacaoMensagensIntervalo);
    }

    atualizacaoMensagensIntervalo = setInterval(() => {
        obterMensagens();
        obterParticipantes();
    }, 5000);

    manterConexao();
}

// Mantém a conexão ativa
function manterConexao() {
    intervaloConexao = setInterval(async () => {
        try {
            const response = await fetch(ENDPOINTS.STATUS, {
                method: 'POST',
                headers: {
                    ...DEFAULT_HEADERS,
                    'user': nomeParticipante,
                },
            });

            if (response.status === 200) {
                console.log('Conexão mantida com sucesso');
            } else if (response.status === 404) {
                console.error('Usuário não encontrado para manter a conexão.');
            } else {
                console.error(`Erro ao manter a conexão: ${response.status}`);
            }
        } catch (error) {
            console.error('Erro ao manter a conexão:', error);
        }
    }, 5000);
}

// Função para enviar mensagem
async function enviarMensagem(remetente, destinatario, conteudo) {
    try {
        const response = await fetch(ENDPOINTS.MENSAGENS, {
            method: 'POST',
            headers: {
                ...DEFAULT_HEADERS,
                'user': remetente,
            },
            body: JSON.stringify({
                from: remetente,
                to: destinatario,
                text: conteudo,
                type: "message",
            }),
        });

        if (response.ok) {
            console.log('Mensagem enviada com sucesso');
            document.getElementById('mensagem').value = '';
            obterMensagens();
        } else {
            console.error(`Erro ao enviar mensagem: ${response.status}`);
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
    }
}

// Configura envio de mensagem ao pressionar Enter
document.getElementById('mensagem').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const conteudo = document.getElementById('mensagem').value;

        if (conteudo.trim() !== '') {
            enviarMensagem(nomeParticipante, destinatario, conteudo);
        }
    }
});

// Configura evento de login
document.getElementById('loginForm').addEventListener('submit', telaLogin);

// Configura o menu lateral e privacidade
document.addEventListener('DOMContentLoaded', () => {
    const menuLateral = document.getElementById('menu-lateral');
    const menuAbrir = document.getElementById('menu-lateral-abrir');
    const menuFechar = document.getElementById('menu-lateral-fechar');
    const fundo = document.createElement('div');

    fundo.classList.add('fundo', 'escondido');
    document.body.appendChild(fundo);

    menuAbrir.addEventListener('click', () => {
        menuLateral.classList.remove('oculto');
        menuLateral.classList.add('aberto');
        fundo.classList.remove('escondido');
    });

    menuFechar.addEventListener('click', () => {
        menuLateral.classList.remove('aberto');
        menuLateral.classList.add('oculto');
        fundo.classList.add('escondido');
    });

    fundo.addEventListener('click', () => {
        menuLateral.classList.remove('aberto');
        menuLateral.classList.add('oculto');
        fundo.classList.add('escondido');
    });

    configurarPrivacidade();
});

// Configura privacidade nas mensagens
function configurarPrivacidade() {
    const listaPrivacidade = document.getElementById('lista-privacidade');

    listaPrivacidade.addEventListener('click', (event) => {
        if (event.target.tagName === 'LI') {
            const itens = listaPrivacidade.querySelectorAll('li');
            itens.forEach((item) => item.classList.remove('selecionado'));

            event.target.classList.add('selecionado');
            const tipoMensagem = event.target.textContent.trim() === 'Privada' ? 'privada' : 'pública';

            const statusDestinatario = document.getElementById('status-destinatario');
            statusDestinatario.textContent = `Conversando com: ${destinatario} (${tipoMensagem})`;
        }
    });
}
