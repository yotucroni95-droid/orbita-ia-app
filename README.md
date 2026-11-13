# Órbita IA (app sem nuvem)

Assistente pessoal e de negócios da **Órbita Virtual**. Você conversa com ele e ele anota tudo: gastos, recebimentos, compromissos, tarefas, metas e anotações.

- **Funciona sem internet** depois de aberto uma vez.
- **Não depende de nenhuma nuvem nem de conta**: os dados ficam só no celular de quem usa.
- **Instalável** como app, com ícone na tela inicial.

## O que ele entende

| Você diz | Ele faz |
|---|---|
| gastei 45 no mercado | Anota uma saída (Alimentação) |
| recebi 800 de um cliente ontem | Anota uma entrada (Serviços) |
| marca reunião com o contador sexta às 10h | Agenda o compromisso |
| lembra de pagar o boleto da internet dia 20 | Agenda um pagamento |
| tenho que ligar pro fornecedor amanhã | Cria uma tarefa |
| criar meta de 10 mil para reserva | Cria uma meta |
| guardei 500 na meta reserva | Soma na meta |
| anota que o fornecedor entrega toda terça | Guarda uma anotação |
| como estou este mês? | Resumo de entradas, saídas e saldo |
| quanto gastei com mercado? | Total por categoria |
| o que tenho amanhã? · quais contas vencem? | Lista da agenda e pagamentos |
| desfazer · na verdade foi 60 · foi da empresa | Desfaz ou corrige o último registro |

## Arquivos

| Arquivo | O que é |
|---|---|
| `app.src.html` | Telas e visual do app. É aqui que se edita. |
| `assistente.js` | O "cérebro": entende as frases e responde. |
| `build.py` | Gera o `index.html` final. Rode `python3 build.py` depois de editar. |
| `index.html` | Arquivo publicado. Gerado pelo `build.py`, não edite à mão. |
| `sw.js` / `manifest.webmanifest` | Fazem o app ser instalável e funcionar sem internet. |
| `assets/` | Logo, ícones e capas de abertura. |

## Privacidade

Tudo o que a pessoa registra fica guardado **apenas no aparelho dela** (armazenamento do navegador). Ninguém mais tem acesso, nem o dono do app. Em **Ajustes**, dá para baixar e restaurar um backup.

Existe também uma versão com IA avançada, que roda pela conta do Claude, no repositório privado `orbita-ia`.
