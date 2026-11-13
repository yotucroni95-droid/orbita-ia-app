/* Base local de respostas revisáveis. Não consulta serviços de IA ou internet.
   Acrescente exemplos e regras específicas antes das gerais. Não guarda dados pessoais. */
(function(){
const normal=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
const itens=[
['identidade',/\b(voce e (uma? )?ia|voce e real|quem (e|criou) voce|qual (e )?(o )?seu nome|chatgpt|claude|robo|inteligencia artificial)\b/,
'Sou a Órbita, um assistente com respostas programadas e reconhecimento de comandos. Organizo seus registros e dou dicas gerais a partir de uma base local. Não sou uma IA generativa e não pesquiso na internet.'],
['privacidade',/\b(dados|informacoes|anotacoes)\b.*\b(salv|guard|perd|segur|privad|nuvem)|\b(backup|cookies|sincroniza|trocar de celular|outro aparelho)\b/,
'Suas anotações ficam neste navegador e aparelho. Não há conta nem sincronização. Para recuperar os dados se trocar de aparelho ou limpar o navegador, baixe um arquivo em **Ajustes → Baixar backup** e use **Restaurar backup**. Quem usa o mesmo perfil do navegador pode acessar os mesmos registros.'],
['offline',/\b(sem internet|offline|precisa de internet|custa|gratuito|mensalidade)\b/,
'Esta versão não usa serviços pagos de IA. Depois de carregar os arquivos do app, os comandos e respostas locais podem funcionar sem internet. Guarde backups das suas anotações em Ajustes.'],
['limites',/\b(aprende sozinho|sabe tudo|qualquer pergunta|conhecimento geral|o que voce sabe fazer)\b/,
'Tenho uma base de respostas sobre organização, negócios e algumas curiosidades. Reconheço comandos e certas grafias comuns, mas não aprendo sozinho nem sei tudo. Experimente “como melhorar minha empresa?” ou “me conte uma curiosidade”.'],
['notificacao',/\b(notificacao|me avisar|avisa sozinho|alarme|app fechado)\b/,
'Posso registrar o compromisso e mostrá-lo na agenda. Esta versão não garante alertas com o app fechado. Para um aviso no horário, coloque também um alarme no celular.'],
['vendas',/\b(vender mais|aumentar (as |minhas )?vendas|melhorar (as |minhas )?vendas|atrair clientes|conseguir clientes|poucas vendas|nao consigo vender)\b/,
'Para vender mais, comece com um teste pequeno:\n1. Escolha um público e uma necessidade concreta.\n2. Mostre fotos claras e explique o benefício do produto.\n3. Facilite o contato e responda com atenção.\n4. Registre quantas pessoas perguntaram e quantas compraram.\n5. Repita o que funcionou, sem prometer resultados garantidos.'],
['empresa',/\b(ajudar|melhorar|organizar|crescer|crescimento|gerenciar|administrar)\b.*\b(empresa|negocio|loja)|\b(dicas? (de|para|pra) (negocios|empresa|empreender)|sou empreendedor|abrir uma empresa)\b/,
'Comece por quatro hábitos:\n- Registre entradas e saídas todos os dias.\n- Separe as contas pessoais das contas da empresa.\n- Escolha três prioridades para a semana.\n- Converse com seus clientes para descobrir o que melhorar.\n\nVocê pode me dizer “recebi mil reais de um cliente” ou “tenho que conferir o estoque amanhã”.'],
['marketing',/\b(marketing|divulgar|divulgacao|instagram|redes sociais|postar|publicacao|conteudo|propaganda)\b/,
'Uma rotina simples de divulgação: mostre o produto em uso, responda uma dúvida frequente e apresente um bastidor da loja. Inclua um convite claro para conversar. Use imagens autorizadas e informações verdadeiras. Observe quais publicações trazem contatos, não apenas curtidas.'],
['atendimento',/\b(atendimento|atender|cliente insatisfeito|reclamacao|reclamacoes|fidelizar|fidelizacao)\b/,
'Ouça o cliente sem interromper, confirme o que ele precisa e explique o próximo passo com prazo realista. Se houver um problema, registre o combinado e acompanhe a solução. Um atendimento consistente ajuda a construir confiança.'],
['estoque',/\b(estoque|mercadoria parada|produtos parados|inventario)\b/,
'Liste o que entrou, o que saiu e o que está parado. Confira os produtos mais procurados com frequência e defina quando repor. Antes de comprar mais, observe a procura e o prazo do fornecedor. Produtos com validade precisam de acompanhamento próprio.'],
['fornecedor',/\b(fornecedor|fornecedores|negociar|negociacao)\b/,
'Compare qualidade, prazo de entrega, condições e custo total. Registre os acordos por escrito e evite depender de um único fornecedor quando houver alternativas. Negociar bem inclui cumprir o que foi combinado.'],
['preco',/\b(preco|precificar|precificacao|desconto|promocao|promocoes)\b/,
'Antes de definir um preço ou desconto, levante custo do produto, despesas da venda e demais custos da operação. Compare com o valor percebido pelo cliente. Não use só o preço do concorrente: uma promoção precisa continuar fazendo sentido para o seu negócio.'],
['caixa',/\b(fluxo de caixa|capital de giro|organizar (as |minhas )?financas|controlar (os |meus )?gastos|reduzir (os )?custos|gastar menos|economizar)\b/,
'Registre o dinheiro que entra e sai, acompanhe os vencimentos e reserve tempo para revisar a semana. Separe custos essenciais dos que podem ser ajustados. Fluxo de caixa é o movimento do dinheiro; saldo positivo sozinho não prova que a empresa teve lucro.'],
['lucro',/\b(diferenca|significa|o que e|explique)\b.*\b(lucro|faturamento|receita|saldo)\b/,
'Faturamento é o valor das vendas no período. Lucro depende das receitas e de todos os custos e despesas. Saldo de caixa é o dinheiro disponível. Eles podem ser diferentes, especialmente quando há vendas e pagamentos a prazo. O app resume apenas os registros que você informou.'],
['produtividade',/\b(produtividade|organizar (meu |o )?dia|organizar (minha |a )?semana|organiza minha semana|prioridades|procrastinacao|procrastinar|falta de tempo)\b/,
'Escolha até três prioridades, divida tarefas grandes em passos pequenos e reserve um horário para cada passo. Separe o que é urgente do que é importante. Deixe algum espaço para imprevistos. Para registrar: “tenho que ligar para o fornecedor amanhã”.'],
['metas',/\b(como|dicas|ajuda)\b.*\b(metas?|objetivos?|planejamento)\b/,
'Defina um objetivo específico, uma medida de progresso e um prazo realista. Quebre o objetivo em ações semanais. Revise o andamento e ajuste o plano quando necessário. Para uma meta de valor: “criar meta de cinco mil para reserva”.'],
['equipe',/\b(equipe|funcionarios|lideranca|delegar|liderar|motivacao)\b/,
'Deixe claro o resultado esperado, quem é responsável e qual é o prazo. Escute dificuldades e dê retorno específico sobre o trabalho. Delegar funciona melhor quando a pessoa também tem informação e recursos para executar.'],
['seguranca',/\b(senha|golpe|phishing|seguranca digital|link suspeito)\b/,
'Desconfie de pedidos urgentes de dinheiro ou códigos. Confirme a identidade por um canal conhecido, use senhas diferentes e ative a verificação em duas etapas quando disponível. Não registre senhas ou códigos bancários nas anotações do app.'],
['curiosidade',/\b(curiosidade|fato interessante|algo interessante|voce sabia)\b/,
'Uma curiosidade: o polvo tem três corações. Dois bombeiam sangue para as brânquias e um para o restante do corpo. Posso também explicar por que o céu é azul, por que existe ano bissexto ou como as abelhas se comunicam.'],
['ceu',/\b(ceu.*azul|azul.*ceu)\b/,
'O céu parece azul porque as moléculas da atmosfera espalham a luz solar. A luz azul é espalhada mais intensamente do que a vermelha, chegando aos nossos olhos de várias direções.'],
['abelhas',/\b(abelha|abelhas)\b/,
'Abelhas podem comunicar a direção e a distância de uma fonte de alimento por movimentos conhecidos como dança das abelhas. Elas também têm um papel importante na polinização de muitas plantas.'],
['bissexto',/\b(bissexto|fevereiro.*29)\b/,
'Um ano bissexto tem 366 dias. No calendário gregoriano, anos divisíveis por 4 são bissextos, exceto os divisíveis por 100 que não sejam também divisíveis por 400. Esse ajuste aproxima o calendário da duração do ano solar.'],
['agua',/\b(ciclo da agua|como.*chuva|por que chove)\b/,
'No ciclo da água, parte da água evapora, o vapor pode se condensar formando nuvens e a água retorna à superfície como precipitação, por exemplo chuva. Depois ela pode infiltrar no solo ou seguir por rios e outros caminhos.'],
['fotossintese',/\b(fotossintese|plantas.*luz)\b/,
'Na fotossíntese, plantas usam energia da luz para produzir açúcares a partir de água e gás carbônico. Nesse processo, liberam oxigênio. Os açúcares ajudam a sustentar seu crescimento.'],
['tempo',/\b(previsao do tempo|vai chover|noticias|cotacao|dolar hoje|resultado do jogo|quem ganhou)\b/,
'Não consulto informações ao vivo. Para previsão do tempo, notícias, cotações ou resultados, confira uma fonte atualizada. Posso ajudar com anotações e explicações gerais da minha base local.'],
['especialista',/\b(remedio|medicamento|diagnostico|dor no|dor de|imposto|tributacao|processo judicial|investir|investimento|emprestimo)\b/,
'Esse assunto depende de detalhes que eu não consigo avaliar com segurança. Posso ajudar a organizar informações e perguntas para um profissional da área, mas não indicar tratamento, decisão jurídica ou investimento personalizado.'],
['agradecimento',/^(muito )?(obrigad[oa]|valeu|vlw|brigad[oa]|show|top|perfeito|beleza|blz)[!. ]*$/,
'Por nada! Quando precisar, posso anotar um gasto, uma tarefa ou um compromisso.'],
['despedida',/^(tchau|ate mais|ate logo|falou|flw|boa noite vou dormir)[!. ]*$/,
'Até mais! Seus registros salvos continuam neste navegador. Volte quando precisar organizar o dia.'],
['humor',/\b(piada|me faz rir)\b/,
'Uma leve: por que o livro de matemática ficou preocupado? Porque tinha muitos problemas! Quer uma dica de organização ou prefere registrar alguma coisa?'],
['bemestar',/\b(tudo bem|td bem|tdb|como voce esta|como vai voce|como vc ta|como vc esta|como vai|tudo bom)\b/,
'Olá! Tudo certo por aqui, pronto para ajudar. E você? Podemos organizar suas tarefas, registrar entradas e gastos ou conversar sobre dicas para o seu negócio.'],
['saudacao',/^(oi+|ola|olaa|opa|eai|e ai|bom dia|boa tarde|boa noite|hey|salve)[!. ,]*$/,
'Olá! Como posso ajudar hoje? Você pode dizer “gastei quatrocentos com gasolina”, pedir uma dica para a empresa ou me contar uma tarefa.']
];
window.OrbitaConhecimento={
 itens:itens.map(([id,regra,resposta])=>({id,regra,resposta})),
 responder(texto){
  const s=normal(texto);
  // Comandos explícitos não são interceptados por tópicos da base.
  if(/^(anota|anote|anotar|guarda|salva|lembra|lembre|marca|marque|agenda|agende|cria|criar|crie|registra|registre|gastei|paguei|recebi|ganhei|comprei|vendi|tenho que|preciso|desfaz|desfazer|corrige|na verdade|foi da empresa)\b/.test(s))return null;
  const pergunta=/\?$/.test(s)||/^(como|qual|quais|por que|porque|o que|oque|quem|onde|quando|me (da|de|diga|conte|fala)|conte|explique|dicas?|curiosidades?|quero (uma dica|saber|melhorar)|nao consigo|organiza minha semana)\b/.test(s);
  for(const [id,re,resposta] of itens){
   if(re.test(s)&&(pergunta||['saudacao','bemestar','agradecimento','despedida'].includes(id)||s.split(' ').length<=3))return resposta;
  }
  return null;
 }
};
})();
