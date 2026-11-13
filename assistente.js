/* =====================================================================
   Órbita IA — assistente local
   Entende frases simples em português, anota tudo no próprio aparelho e
   responde perguntas sobre os números. Não usa internet nem nuvem.

   Ele recebe do app (window.OrbitaCore) só o que precisa:
   estado (S), ações de registro, cálculos e utilitários de data/dinheiro.
   ===================================================================== */
(function () {
  "use strict";

  const nrm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  const cap = s => { s = String(s || "").trim(); return s ? s[0].toUpperCase() + s.slice(1) : s; };
  const pad = n => String(n).padStart(2, "0");
  const iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const MESES = ["janeiro","fevereiro","marco","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const MESES_TXT = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const SEMANA = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"];
  const SEMANA_TXT = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];

  /* ---------------- números e dinheiro ---------------- */
  function toNumber(s) {
    s = String(s || "").trim();
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^\d+,\d+$/.test(s)) s = s.replace(",", ".");
    else if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, "");
    const v = parseFloat(s);
    return isNaN(v) ? null : v;
  }
  // tira datas e horas antes de procurar o valor, para "dia 12" ou "10h" não virarem dinheiro
  function semDatas(t) {
    return t
      .replace(/\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\b/g, " ")
      .replace(/\bdia\s+\d{1,2}\b/g, " ")
      .replace(/\b\d{1,2}(:\d{2}|h\d{0,2}|\s*horas?)\b/g, " ")
      .replace(/\b(as|a|pras|para as)\s+\d{1,2}\b(?!\s*(reais|real|mil|k|conto))/g, " ");
  }
  function valorDe(texto) {
    const s = converterValores(texto);
    const pats = [
      /r\$\s*(\d[\d.,]*)(\s*mil\b)?/,
      /(\d[\d.,]*)\s*(mil|k)\b/,
      /(\d[\d.,]*)\s*(reais|real|contos?|pila|pilas)\b/,
      /(?:^|\s)(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+,\d{1,2}|\d+)(?=\s|$|[!?.;])/
    ];
    for (const p of pats) {
      const m = s.match(p);
      if (!m) continue;
      let v = toNumber(m[1].replace(/[.,]$/, ""));
      if (v == null) continue;
      if (m[2] && /^(\s*mil|mil|k)$/.test(m[2].trim()) ) v *= 1000;
      if (v <= 0) continue;
      return v;
    }
    return null;
  }



  // Variações comuns, sem correção aproximada de valores financeiros.
  const grafias = {gastey:'gastei',gasteii:'gastei',gastei:'gastei',
    resebi:'recebi',receby:'recebi',recebii:'recebi',recebir:'recebi',
    paguei:'paguei',pagei:'paguei',paguey:'paguei',
    gasolna:'gasolina',gazolina:'gasolina',gasolina:'gasolina',
    anotei:'anota',anotta:'anota',anotaa:'anota',anote:'anote',
    quatrocento:'quatrocentos',quatrocientos:'quatrocentos',
    quinhento:'quinhentos',seiscento:'seiscentos',setessentos:'setecentos'};
  const corrigir = t => String(t).replace(/[A-Za-zÀ-ÿ]+/g,w=>grafias[nrm(w)]||w);
  const NUM = {zero:0,um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,
    sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,treze:13,catorze:14,quatorze:14,
    quinze:15,dezesseis:16,dezasseis:16,dezessete:17,dezassete:17,dezoito:18,
    dezenove:19,dezanove:19,vinte:20,trinta:30,quarenta:40,cinquenta:50,
    sessenta:60,setenta:70,oitenta:80,noventa:90,cem:100,cento:100,
    duzentos:200,duzentas:200,trezentos:300,trezentas:300,quatrocentos:400,
    quatrocentas:400,quinhentos:500,quinhentas:500,seiscentos:600,
    seiscentas:600,setecentos:700,setecentas:700,oitocentos:800,oitocentas:800,
    novecentos:900,novecentas:900};
  const nword = '(?:'+Object.keys(NUM).join('|')+'|mil|milhao|milhoes)';
  const extensoRE = new RegExp('\\b'+nword+'(?:\\s+(?:e\\s+)?'+nword+')*\\b','g');
  function lerExtenso(t) {
    let total=0,grupo=0;
    for(const w of t.split(/\s+/)){
      if(w==='e')continue;
      if(w==='mil'){total+=(grupo||1)*1000;grupo=0;}
      else if(w==='milhao'||w==='milhoes'){total=(total+grupo||1)*1000000;grupo=0;}
      else grupo+=NUM[w]||0;
    }
    return total+grupo;
  }
  function converterValores(texto) {
    const normal=nrm(corrigir(texto));
    // Remover datas e horários antes de converter palavras em números.
    const t=semDatas(normal);
    return t.replace(extensoRE,(m,offset)=>{
      const antes=t.slice(0,offset),depois=t.slice(offset+m.length);
      if(/\b(dia|as|a|para as|pras)\s*$/.test(antes)||/^\s*(horas?|h)\b/.test(depois))return m;
      // Artigos isolados ("um cliente") não são dinheiro.
      if(/^(um|uma|dois|duas)$/.test(m)&&!/^\s*(reais?|centavos?|mil)\b/.test(depois))return m;
      return String(lerExtenso(m));
    }).replace(/(\d+)\s+reais?\s+e\s+(\d+)\s+centavos?\b/g,(_,a,b)=>a+','+b.padStart(2,'0'))
      .replace(/(\d+)\s+centavos?\b/g,(_,a)=>'0,'+a.padStart(2,'0'));
  }

  /* ---------------- datas e horas ---------------- */
  // futuro=true: "sexta" é a próxima sexta. futuro=false: "sexta" é a última sexta.
  function dataDe(texto, futuro) {
    const s = nrm(texto), hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    let m;
    if (/\bdepois de amanha\b/.test(s)) return addDays(hoje, 2);
    if (/\bamanha\b/.test(s)) return addDays(hoje, 1);
    if (/\banteontem\b/.test(s)) return addDays(hoje, -2);
    if (/\bontem\b/.test(s)) return addDays(hoje, -1);
    if (/\bhoje\b/.test(s)) return hoje;
    if ((m = s.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/))) {
      let y = m[3] ? +m[3] : hoje.getFullYear(); if (y < 100) y += 2000;
      const d = new Date(y, +m[2] - 1, +m[1]);
      if (!m[3] && futuro && d < hoje) d.setFullYear(y + 1);
      return d;
    }
    if ((m = s.match(/\bdia\s+(\d{1,2})(?:\s+de\s+([a-z]+))?/))) {
      const mi = m[2] ? MESES.indexOf(m[2]) : -1;
      const d = new Date(hoje.getFullYear(), mi >= 0 ? mi : hoje.getMonth(), +m[1]);
      if (futuro && d < hoje) mi >= 0 ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
      if (!futuro && d > hoje && mi < 0) d.setMonth(d.getMonth() - 1);
      return d;
    }
    for (let i = 0; i < 7; i++) {
      if (new RegExp("\\b" + SEMANA[i] + "(-feira)?\\b").test(s)) {
        const prox = /\b(proxim[ao]|que vem)\b/.test(s);
        let diff = (i - hoje.getDay() + 7) % 7;
        if (futuro) { if (diff === 0 && prox) diff = 7; return addDays(hoje, diff); }
        diff = (hoje.getDay() - i + 7) % 7; return addDays(hoje, -diff);
      }
    }
    if (/\b(semana que vem|proxima semana)\b/.test(s)) return addDays(hoje, 7);
    if (/\b(mes que vem|proximo mes)\b/.test(s)) return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    return null;
  }
  function horaDe(texto) {
    const s = nrm(texto); let m, h = null, mi = 0;
    if (/\bmeio[- ]dia\b/.test(s)) h = 12;
    else if (/\bmeia[- ]noite\b/.test(s)) h = 0;
    else if ((m = s.match(/\b(\d{1,2}):(\d{2})\b/))) { h = +m[1]; mi = +m[2]; }
    else if ((m = s.match(/\b(\d{1,2})\s*h\s*(\d{2})?\b/))) { h = +m[1]; mi = +(m[2] || 0); }
    else if ((m = s.match(/\b(\d{1,2})\s*horas?\b/))) h = +m[1];
    else if ((m = s.match(/\b(?:as|a|pras|para as)\s+(\d{1,2})(?:\s*e\s*(meia|\d{2}))?\b/))) { h = +m[1]; mi = m[2] === "meia" ? 30 : +(m[2] || 0); }
    if (h == null || h > 23 || mi > 59) return null;
    if (/\b(da tarde|da noite)\b/.test(s) && h < 12) h += 12;
    if (/\bmeia\b/.test(s) && /\be meia\b/.test(s) && mi === 0) mi = 30;
    return pad(h) + ":" + pad(mi);
  }
  const localDate = d => typeof d === "string" ? new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) : d;
  const fmtDia = d => {
    d = localDate(d);
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - hoje) / 864e5);
    if (diff === 0) return "hoje"; if (diff === 1) return "amanhã"; if (diff === -1) return "ontem";
    if (diff > 1 && diff < 7) return SEMANA_TXT[new Date(d).getDay()] + " (" + pad(new Date(d).getDate()) + "/" + pad(new Date(d).getMonth() + 1) + ")";
    return pad(new Date(d).getDate()) + "/" + pad(new Date(d).getMonth() + 1);
  };

  /* ---------------- categorias ---------------- */
  const CAT_SAIDA = [
    ["Alimentação", /\b(mercado|supermercado|feira|comida|almoco|jantar|lanche|restaurante|padaria|ifood|acougue|pizza|hamburguer|cafe|acai)\b/],
    ["Transporte", /\b(gasolina|combustivel|etanol|diesel|uber|99|onibus|passagem|estacionamento|pedagio|mecanico|oficina|moto taxi|mototaxi)\b/],
    ["Energia/Água", /\b(luz|energia|agua|conta de luz|conta de agua|celpe|compesa|neoenergia)\b/],
    ["Internet/Telefone", /\b(internet|telefone|celular|wifi|wi-fi|plano do celular|recarga)\b/],
    ["Aluguel", /\b(aluguel|condominio)\b/],
    ["Impostos", /\b(imposto|impostos|das|simples nacional|iptu|ipva|inss|darf|taxa)\b/],
    ["Funcionários", /\b(funcionario|funcionarios|folha|salario|salarios|diarista|diaria|vale|comissao)\b/],
    ["Fornecedores", /\b(fornecedor|fornecedores|mercadoria|estoque|materia[- ]prima|insumo|insumos|reposicao)\b/],
    ["Marketing", /\b(marketing|anuncio|anuncios|propaganda|impulsionamento|trafego|panfleto|instagram|google ads)\b/],
    ["Contador", /\b(contador|contabilidade)\b/],
    ["Cartão de crédito", /\b(cartao|fatura)\b/],
    ["Boleto", /\bboleto\b/],
    ["Financiamento", /\b(financiamento|parcela do carro|parcela da moto)\b/],
    ["Empréstimo", /\b(emprestimo)\b/],
    ["Saúde", /\b(farmacia|remedio|medico|dentista|plano de saude|exame|hospital|consulta)\b/],
    ["Educação", /\b(escola|curso|faculdade|livro|livros|mensalidade|material escolar)\b/],
    ["Software", /\b(sistema|software|aplicativo|app|assinatura|dominio|hospedagem)\b/],
    ["Lazer", /\b(cinema|viagem|passeio|festa|bar|show|netflix|spotify|presente)\b/]
  ];
  const CAT_ENTRADA = [
    ["Pró-labore", /\b(pro[- ]?labore)\b/],
    ["Salário", /\b(salario)\b/],
    ["Aluguel recebido", /\b(aluguel)\b/],
    ["Rendimentos", /\b(rendimento|rendimentos|juros|investimento|dividendo)\b/],
    ["Reembolso", /\b(reembolso|devolucao|estorno)\b/],
    ["Empréstimo recebido", /\b(emprestimo)\b/],
    ["Serviços", /\b(servico|servicos|consultoria|job|trabalho|freela|freelance|projeto|cliente)\b/],
    ["Vendas", /\b(venda|vendas|vendi|vendemos|pedido|pedidos)\b/]
  ];
  const PESSOAL_PADRAO = ["Alimentação", "Saúde", "Educação", "Lazer"];
  const categoriaDe = (s, tipo) => { for (const [c, re] of (tipo === "entrada" ? CAT_ENTRADA : CAT_SAIDA)) if (re.test(s)) return c; return tipo === "entrada" ? "Vendas" : "Outros"; };
  const contaDe = (s, cat) => {
    if (/\b(pessoal|particular|minha casa|pra casa|de casa|meu bolso|minha conta)\b/.test(s)) return "pessoal";
    if (/\b(empresa|loja|negocio|firma|cnpj|da agencia|do negocio)\b/.test(s)) return "empresa";
    return PESSOAL_PADRAO.includes(cat) ? "pessoal" : "empresa";
  };

  /* ---------------- limpeza de títulos ---------------- */
  const RUIDO = [
    /\b(eu|hoje|ontem|anteontem|amanha|depois de amanha|agora|ai|por favor|pfv|pf|porfavor)\b/g,
    /\b(gastei|paguei|comprei|pago|gasto|despesa de|despesa|saiu|transferi|mandei|recebi|vendi|entrou|ganhei|faturei|receita de|receita|recebimento de|recebimento|me pagou|me pagaram)\b/g,
    /\b(marca|marcar|marque|agenda|agendar|agende|anota|anote|anotar|lembra|lembrar|lembre|lembrete|me lembra de|me lembre de|cria|criar|crie|adiciona|adicionar|coloca|colocar|bota|botar|registra|registrar)\b/g,
    /r\$\s*[\d.,]+(\s*mil)?/g, /\b[\d.,]+\s*(mil|k|reais|real|contos?|pilas?)\b/g,
    /\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\b/g, /\bdia\s+\d{1,2}(\s+de\s+[a-z]+)?\b/g,
    /\b(as|a|pras|para as)\s+\d{1,2}(:\d{2}|\s*h\s*\d{0,2}|\s*horas?)?(\s*e\s*(meia|\d{2}))?\b/g, /\b\d{1,2}(:\d{2}|\s*h\s*\d{0,2}|\s*horas?)\b/g,
    /\b(meio[- ]dia|meia[- ]noite|da tarde|da noite|da manha|de manha|a tarde|a noite)\b/g,
    /\b(na |no |da |do )?(proxim[ao]|que vem)\b/g, /\b(segunda|terca|quarta|quinta|sexta|sabado|domingo)(-feira)?\b/g,
    /\b(na conta|conta|da empresa|pra empresa|empresa|pessoal|particular|da loja|do negocio)\b/g,
    /\b(semana que vem|proxima semana|mes que vem|proximo mes)\b/g,
    /\b(tenho que|tenho de|preciso|nao esquecer)\b/g,
    /(^|\s)\d[\d.,]*(?=\s|$)/g
  ];
  function limpar(original) {
    // trabalha numa cópia sem acento para achar o que remover, mas devolve o texto do usuário
    // tira acentos letra por letra (sem juntar espaços), para os índices baterem com o texto original
    const t = (" " + original + " ").normalize("NFC");
    let mask = t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    for (const re of RUIDO) mask = mask.replace(re, m => " ".repeat(m.length));
    let out = mask.length === t.length ? t.split("").map((c, i) => mask[i] === " " ? " " : c).join("") : mask;
    out = out.replace(/[!?.;:,]+/g, " ").replace(/\s+/g, " ").trim()
      .replace(/^(de|do|da|dos|das|com|no|na|nos|nas|em|pra|para|pro|o|a|os|as|um|uma|que|e)\s+/i, "")
      .replace(/^(de|do|da|com|no|na|em|pra|para|pro)\s+/i, "")
      .replace(/\s+(de|do|da|com|no|na|em|pra|para|pro|e)$/i, "");
    return cap(out);
  }

  /* ---------------- motor ---------------- */
  let C = null;            // núcleo do app
  let ultimo = null;       // último item criado: {k, id}

  const nomeConta = c => c === "pessoal" ? "pessoal" : "da empresa";
  const periodoDe = s => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    if (/\bhoje\b/.test(s)) return { de: iso(hoje), ate: iso(hoje), nome: "hoje" };
    if (/\bontem\b/.test(s)) { const d = addDays(hoje, -1); return { de: iso(d), ate: iso(d), nome: "ontem" }; }
    if (/\bsemana\b/.test(s)) { const d = addDays(hoje, -((hoje.getDay() + 6) % 7)); return { de: iso(d), ate: iso(addDays(d, 6)), nome: "nesta semana" }; }
    if (/\bmes passado\b/.test(s)) { const d = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1); const f = new Date(hoje.getFullYear(), hoje.getMonth(), 0); return { de: iso(d), ate: iso(f), nome: "em " + MESES_TXT[d.getMonth()] }; }
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1), f = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    return { de: iso(d), ate: iso(f), nome: "neste mês" };
  };
  const noPeriodo = (t, p) => t.data >= p.de && t.data <= p.ate;
  const filtroConta = s => /\b(pessoal|particular|minha casa)\b/.test(s) ? "pessoal" : /\b(empresa|loja|negocio)\b/.test(s) ? "empresa" : null;

  function registrarTx(tipo, txt, s) {
    const valor = valorDe(txt);
    if (!valor) return "Qual foi o valor? Me diga de novo com o valor, por exemplo: **" + (tipo === "entrada" ? "recebi 300 de um cliente" : "gastei 50 no mercado") + "**.";
    const categoria = categoriaDe(s, tipo);
    const conta = contaDe(s, categoria);
    const d = dataDe(txt, false) || new Date();
    let descricao = limpar(converterValores(txt)) || categoria;
    if (descricao.length < 2 || /^(que|de|do|da|com|reais|real)$/i.test(descricao)) descricao = categoria;
    C.tool("registrar_lancamento", { tipo, valor, descricao, categoria, conta, data: iso(d) });
    ultimo = { k: "tx", id: C.S().tx[C.S().tx.length - 1].id };
    const quando = fmtDia(d);
    const extra = conta === "pessoal" ? " Se foi da empresa, é só dizer **foi da empresa**." : "";
    return (tipo === "entrada" ? "Boa! Anotei a entrada de **" : "Anotado: saída de **") + C.money(valor) + "** (" + categoria + ", conta " + nomeConta(conta) + ", " + quando + ")." + extra;
  }

  function registrarEvento(txt, s) {
    const d = dataDe(txt, true);
    const h = horaDe(txt);
    if (!d && !h) return null;
    const dia = d || new Date();
    const tipo = /\b(pagar|pagamento|vence|vencimento|boleto|fatura|parcela)\b/.test(s) ? "pagamento" : /\b(lembra|lembrar|lembre|lembrete)\b/.test(s) ? "lembrete" : "compromisso";
    let titulo = limpar(txt.replace(/\b(me lembra|me lembre|lembra|lembre)( de| que)?\b/gi, " ")) || (tipo === "pagamento" ? "Pagamento" : "Compromisso");
    if (tipo === "pagamento" && !/^pagar/i.test(titulo) && /\bpagar\b/.test(s)) titulo = "Pagar " + titulo.charAt(0).toLowerCase() + titulo.slice(1);
    C.tool("agendar_compromisso", { titulo, quando: iso(dia) + "T" + (h || "09:00"), tipo });
    ultimo = { k: "eventos", id: C.S().eventos[C.S().eventos.length - 1].id };
    return "Agendado: **" + titulo + "**, " + fmtDia(dia) + (h ? " às " + h.replace(":00", "h") : " (sem horário, deixei às 9h)") + ".";
  }

  function responder(txt) {
    txt = corrigir(txt);
    const S = C.S();
    const s = nrm(txt);
    if (!s) return "Pode falar. 🙂";

    // desfazer / corrigir
    if (/^(desfaz|desfazer|desfaca|cancela|cancelar|apaga|apague|apagar|remove|remova|exclui|exclua)\b.*\b(ultim|isso|anterior)/.test(s) || /^(desfaz|desfazer|desfaca)$/.test(s)) {
      if (!ultimo) return "Não tenho nada recente para desfazer.";
      const lista = S[ultimo.k]; const i = lista.findIndex(x => x.id === ultimo.id);
      if (i < 0) { ultimo = null; return "Esse item já tinha sido removido."; }
      const item = lista.splice(i, 1)[0]; ultimo = null;
      return "Pronto, apaguei: **" + (item.descricao || item.titulo || item.nome || item.texto) + "**.";
    }
    if (/^(na verdade|corrige|corrigir|corrija|errei|ops|opa)\b/.test(s) || /^(foi|era)\s+(da empresa|pessoal|particular|da loja)\b/.test(s)) {
      const t = S.tx.find(x => ultimo && ultimo.k === "tx" && x.id === ultimo.id) || S.tx[S.tx.length - 1];
      if (!t) return "Não achei nenhum lançamento para corrigir.";
      const mud = {};
      const v = valorDe(txt); if (v) mud.valor = v;
      const c = filtroConta(s); if (c) mud.conta = c;
      if (/\b(recebi|entrada|entrou)\b/.test(s)) mud.tipo = "entrada";
      if (/\b(gastei|saida|paguei|despesa)\b/.test(s)) mud.tipo = "saida";
      const d = dataDe(txt, false); if (d) mud.data = iso(d);
      if (!Object.keys(mud).length) return "O que mudou? Ex.: **na verdade foi 60**, **foi da empresa** ou **foi ontem**.";
      C.tool("ajustar_ultimo_lancamento", mud);
      return "Corrigido! Agora está: **" + t.descricao + "**, " + C.money(t.valor) + ", conta " + nomeConta(t.conta) + ".";
    }

    const respostaBase = window.OrbitaConhecimento?.responder(txt);
    if (respostaBase) return respostaBase;

    // conversa
    if (/^(oi|ola|opa|eai|e ai|bom dia|boa tarde|boa noite|hey|salve)\b/.test(s) && s.length < 30) {
      const n = S.nome ? ", " + S.nome.split(" ")[0] : "";
      return "Olá" + n + "! Me conta o que aconteceu ou o que você precisa: um gasto, um recebimento, um compromisso, uma tarefa… eu anoto tudo.";
    }
    if (/\b(obrigad|valeu|vlw|show|top|perfeito|beleza|blz)\b/.test(s) && s.length < 30) return "Por nada! Tô aqui. 🙌";
    if (/\b(ajuda|o que voce faz|como funciona|o que voce sabe fazer|comandos)\b/.test(s)) return AJUDA;

    // esquecer anotação
    if (/^(esquece|esqueca|esquecer|apaga a nota|apaga a anotacao)\b/.test(s)) {
      const q = limpar(txt.replace(/^(esquece|esqueça|esquecer|apaga a nota|apaga a anotação)( que| de| a| o)?/i, "")).toLowerCase();
      if (!q) return "O que devo esquecer?";
      const r = C.tool("esquecer", { trecho: q });
      return r && r.removidos ? "Esqueci. 👍" : "Não achei nenhuma anotação com **" + q + "**.";
    }

    // perguntas
    const pergunta = /\?$/.test(txt.trim()) || /^(quanto|quantos|quantas|qual|quais|como|onde|o que|oque|tenho(?! que\b| de\b)|mostra|mostre|lista|liste|me fala|me diz|me mostra|resumo|cade|minhas?|meus?|ver|veja)\b/.test(s) || (s.split(" ").length <= 2 && /^(agenda|tarefas|metas|resumo|saldo|anotacoes|notas|gastos|contas)$/.test(s.replace(/^(minhas?|meus?) /, "")));
    if (pergunta) { const r = consultar(s, txt); return r || "Essa pergunta ainda não está na minha base local. Posso dar dicas gerais para empresas, explicar algumas curiosidades ou consultar seus registros. Não fiz nenhuma anotação."; }

    // orçamento
    if (/\b(orcamento|limite)\b/.test(s) && valorDe(txt)) {
      const cat = categoriaDe(s, "saida"); const v = valorDe(txt);
      C.tool("definir_orcamento", { categoria: cat === "Outros" ? (limpar(txt.replace(/or[cç]amento|limite/gi, "")) || "Outros") : cat, limite: v });
      return "Combinado: limite de **" + C.money(v) + "** por mês para **" + (cat === "Outros" ? "essa categoria" : cat) + "**. Eu te mostro no Painel quando estiver perto.";
    }
    // metas
    if (/\bmeta\b/.test(s) && /\b(guardei|juntei|depositei|coloquei|somar|soma|adiciona|mais|investi)\b/.test(s) && valorDe(txt)) {
      const v = valorDe(txt);
      const alvo = S.metas.find(g => nrm(g.nome).split(" ").filter(w => w.length > 3).some(w => s.includes(w))) || (S.metas.length === 1 ? S.metas[0] : null);
      if (!alvo) return S.metas.length ? "Em qual meta? Você tem: " + S.metas.map(g => "**" + g.nome + "**").join(", ") + "." : "Você ainda não tem metas. Diga, por exemplo: **criar meta de 10 mil para reserva**.";
      C.tool("somar_na_meta", { nome: alvo.nome, valor: v });
      const pct = alvo.alvo ? Math.min(100, Math.round(alvo.atual / alvo.alvo * 100)) : 0;
      return "Somei **" + C.money(v) + "** na meta **" + alvo.nome + "**. Já está em " + pct + "% (" + C.money(alvo.atual) + " de " + C.money(alvo.alvo) + ").";
    }
    if (/\bmeta\b/.test(s) && valorDe(txt)) {
      const v = valorDe(txt);
      let nome = limpar(txt.replace(/\b(criar|crie|cria|nova|uma|minha)?\s*meta\b( de| pra| para)?/gi, " ")) || "Nova meta";
      const prazo = dataDe(txt, true);
      C.tool("criar_meta", { nome, alvo: v, atual: 0, prazo: prazo ? iso(prazo) : "" });
      ultimo = { k: "metas", id: S.metas[S.metas.length - 1].id };
      return "Meta criada: **" + nome + "**, alvo de **" + C.money(v) + "**" + (prazo ? " até " + fmtDia(prazo) : "") + ". Quando guardar dinheiro, diga **guardei 200 na meta**.";
    }

    // anotação explícita
    if (/^(anota|anote|anotar|nota|guarda|guarde|salva|salve|lembra que|lembre que|lembrar que)\b/.test(s) && !(/^(anota|anote)\b/.test(s) && valorDe(txt) && /\b(gastei|paguei|recebi|vendi|comprei)\b/.test(s))) {
      const nota = txt.trim().replace(/^(anota|anote|anotar|nota|guarda|guarde|salva|salve|lembra que|lembre que|lembrar que)\s*(que|aí|ai|:)?\s*/i, "");
      if (nota) { C.tool("memorizar", { fato: cap(nota) }); ultimo = { k: "memoria", id: (S.memoria[S.memoria.length - 1] || {}).id }; return "Anotei: _" + cap(nota) + "_."; }
    }

    // tarefa (sem horário marcado)
    if (/\b(tarefa|preciso|tenho que|tenho de|nao esquecer|pendencia)\b/.test(s) && !horaDe(txt) && !/\b(gastei|paguei|recebi|vendi|comprei)\b/.test(s)) {
      const d = dataDe(txt, true) || new Date();
      const titulo = limpar(txt.replace(/\b(tarefa|preciso|tenho que|tenho de|não esquecer|nao esquecer|pendência|pendencia)\b( de| que)?/gi, " ")) || "Tarefa";
      C.tool("criar_tarefa", { titulo, dia: iso(d) });
      ultimo = { k: "tarefas", id: S.tarefas[S.tarefas.length - 1].id };
      return "Tarefa anotada para " + fmtDia(d) + ": **" + titulo + "**.";
    }

    // agenda (futuro: pagar, marcar, lembrar…)
    const verboAgenda = /\b(marca|marcar|marque|agenda|agendar|agende|reuniao|consulta|compromisso|encontro|visita|ligar|entregar|entrega|pagar|vence|vencimento|lembra|lembrar|lembre|lembrete|aniversario|evento|prova|viagem)\b/.test(s);
    const verboPassado = /\b(gastei|paguei|comprei|recebi|vendi|entrou|ganhei|faturei|saiu|transferi)\b/.test(s);
    if ((verboAgenda || (dataDe(txt, true) && horaDe(txt))) && !verboPassado) { const r = registrarEvento(txt, s); if (r) return r; }

    // dinheiro
    if (/\b(recebi|vendi|vendemos|entrou|ganhei|faturei|receita|recebimento|me pagou|me pagaram|pix de|caiu)\b/.test(s)) return registrarTx("entrada", txt, s);
    if (/\b(gastei|paguei|comprei|pago|gasto|despesa|saiu|transferi|mandei pix|pix pra|pix para|debitou|torrei)\b/.test(s)) return registrarTx("saida", txt, s);

    // tarefa
    if (/\b(tarefa|preciso|tenho que|tenho de|nao esquecer|fazer|pendencia|to do|todo)\b/.test(s)) {
      const d = dataDe(txt, true) || new Date();
      const titulo = limpar(txt.replace(/\b(tarefa|preciso|tenho que|tenho de|não esquecer|nao esquecer|pendência|pendencia)\b( de| que)?/gi, " ")) || "Tarefa";
      C.tool("criar_tarefa", { titulo, dia: iso(d) });
      ultimo = { k: "tarefas", id: S.tarefas[S.tarefas.length - 1].id };
      return "Tarefa anotada para " + fmtDia(d) + ": **" + titulo + "**.";
    }

    return "Não reconheci esse pedido. Tenho respostas programadas, não conhecimento ilimitado. Tente **como melhorar minha empresa?**, **me conte uma curiosidade** ou **ajuda**. Para salvar uma informação, comece com **anota que...**. Não registrei nada com essa mensagem.";
  }

  function consultar(s, txt) {
    const S = C.S();
    const p = periodoDe(s), conta = filtroConta(s);
    const doPeriodo = S.tx.filter(t => noPeriodo(t, p) && (!conta || t.conta === conta));
    const somar = (l, tipo) => l.filter(t => t.tipo === tipo).reduce((a, t) => a + (+t.valor || 0), 0);
    const sufixo = conta ? " (conta " + nomeConta(conta) + ")" : "";

    if (/\b(onde|com o que|com que|maiores|maior)\b.*\b(gast|despes)/.test(s) || /\bmaiores gastos\b/.test(s)) {
      const por = {}; doPeriodo.filter(t => t.tipo === "saida").forEach(t => por[t.categoria] = (por[t.categoria] || 0) + (+t.valor || 0));
      const top = Object.entries(por).sort((a, b) => b[1] - a[1]).slice(0, 4);
      if (!top.length) return "Não tenho gastos anotados " + p.nome + sufixo + ".";
      return "Seus maiores gastos " + p.nome + sufixo + ":\n" + top.map(([c, v], i) => (i + 1) + ". **" + c + "**: " + C.money(v)).join("\n");
    }
    if (/\b(gastei|gasto|gastos|despesa|despesas|saiu|paguei)\b/.test(s)) {
      const cat = categoriaDe(s, "saida"), filtraCat = cat !== "Outros";
      const l = doPeriodo.filter(t => t.tipo === "saida" && (!filtraCat || t.categoria === cat));
      const v = l.reduce((a, t) => a + (+t.valor || 0), 0);
      return "Você gastou **" + C.money(v) + "** " + (filtraCat ? "com " + cat + " " : "") + p.nome + sufixo + (l.length ? " (" + l.length + " lançamento" + (l.length > 1 ? "s" : "") + ")." : ".");
    }
    if (/\b(recebi|entrou|entrada|entradas|faturei|faturamento|vendi|vendas|receita|receitas|ganhei)\b/.test(s)) {
      const v = somar(doPeriodo, "entrada");
      return "Entraram **" + C.money(v) + "** " + p.nome + sufixo + ".";
    }
    if (/\b(saldo|lucro|sobrou|sobra|resultado|balanco|como (estou|esta|to|ta|tou|vai|vao)|resumo|situacao|financas)\b/.test(s)) {
      const e = somar(doPeriodo, "entrada"), sd = somar(doPeriodo, "saida"), r = e - sd;
      let txt2 = "Resumo " + p.nome + sufixo + ":\n- Entradas: **" + C.money(e) + "**\n- Saídas: **" + C.money(sd) + "**\n- " + (r >= 0 ? "Sobrou" : "Faltou") + ": **" + C.money(Math.abs(r)) + "**";
      const por = {}; doPeriodo.filter(t => t.tipo === "saida").forEach(t => por[t.categoria] = (por[t.categoria] || 0) + (+t.valor || 0));
      const top = Object.entries(por).sort((a, b) => b[1] - a[1])[0];
      if (top) txt2 += "\n\nO maior gasto foi com **" + top[0] + "** (" + C.money(top[1]) + ").";
      if (r < 0) txt2 += " Atenção: saiu mais do que entrou.";
      return txt2;
    }
    if (/\b(contas a pagar|vencimento|vencimentos|vence|vencem|boletos|pagamentos)\b/.test(s)) {
      const hoje = iso(new Date()), lim = iso(addDays(new Date(), /\bmes\b/.test(s) ? 31 : 7));
      const l = S.eventos.filter(e => e.tipo === "pagamento" && !e.feito && e.quando.slice(0, 10) >= hoje && e.quando.slice(0, 10) <= lim).sort((a, b) => a.quando < b.quando ? -1 : 1);
      if (!l.length) return "Nenhum pagamento marcado para os próximos dias. 👍";
      return "Pagamentos que vêm aí:\n" + l.map(e => "- **" + e.titulo + "**, " + fmtDia(e.quando.slice(0, 10))).join("\n");
    }
    if (/\b(agenda|compromisso|compromissos|o que tenho|tenho algo|tenho alguma|proximos|reuniao|reunioes|marcado|marcados)\b/.test(s)) {
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      let de = hoje, ate = addDays(hoje, 7), nome = "nos próximos 7 dias";
      if (/\bhoje\b/.test(s)) { ate = hoje; nome = "hoje"; }
      else if (/\bamanha\b/.test(s)) { de = ate = addDays(hoje, 1); nome = "amanhã"; }
      const l = S.eventos.filter(e => !e.feito && e.quando.slice(0, 10) >= iso(de) && e.quando.slice(0, 10) <= iso(ate)).sort((a, b) => a.quando < b.quando ? -1 : 1);
      if (!l.length) return "Nada na agenda " + nome + ". Agenda livre! 😎";
      return "Na agenda " + nome + ":\n" + l.map(e => "- " + fmtDia(e.quando.slice(0, 10)) + " às " + e.quando.slice(11, 16) + " · **" + e.titulo + "**").join("\n");
    }
    if (/\b(tarefa|tarefas|pendencia|pendencias|a fazer)\b/.test(s)) {
      const hoje = iso(new Date());
      const l = S.tarefas.filter(t => !t.feito && t.dia <= iso(addDays(new Date(), 7))).sort((x, y) => x.dia < y.dia ? -1 : 1);
      if (!l.length) return "Nenhuma tarefa pendente. 🎉";
      return "Tarefas pendentes:\n" + l.map(t => "- " + t.titulo + " · " + (t.dia < hoje ? "_atrasada_" : fmtDia(t.dia))).join("\n");
    }
    if (/\bmetas?\b/.test(s)) {
      if (!S.metas.length) return "Você ainda não tem metas. Diga, por exemplo: **criar meta de 10 mil para reserva**.";
      return "Suas metas:\n" + S.metas.map(g => "- **" + g.nome + "**: " + C.money(g.atual) + " de " + C.money(g.alvo) + " (" + (g.alvo ? Math.min(100, Math.round(g.atual / g.alvo * 100)) : 0) + "%)").join("\n");
    }
    if (/\b(anotou|anotei|anotacoes|anotacao|notas|memoria|o que voce sabe|lembra de mim)\b/.test(s)) {
      if (!S.memoria.length) return "Ainda não anotei nada. É só me contar, por exemplo: **anota que o fornecedor entrega toda terça**.";
      return "O que eu anotei:\n" + S.memoria.slice(-10).reverse().map(m => "- " + m.texto).join("\n");
    }
    return null;
  }

  const AJUDA = "Eu anoto e organizo pra você, direto no seu celular. Exemplos:\n" +
    "- **gastei 45 no mercado** ou **recebi 800 de um cliente**\n" +
    "- **marca reunião com o contador sexta às 10h**\n" +
    "- **lembra de pagar o aluguel dia 5**\n" +
    "- **tenho que ligar pro fornecedor amanhã**\n" +
    "- **criar meta de 10 mil para reserva** e depois **guardei 200 na meta**\n" +
    "- **anota que o cliente Pedro prefere WhatsApp**\n\n" +
    "E pode perguntar: **como estou este mês?**, **quanto gastei com mercado?**, **o que tenho amanhã?**, **quais contas vencem?**, **o que você anotou?**\n\n" +
    "Também tenho respostas programadas: **olá, tudo bem?**, **como vender mais?**, **como organizar minha semana?** e **me conte uma curiosidade**.\n\nErrou? Diga **desfazer** ou **na verdade foi 60**.";

  window.OrbitaAssistente = {
    ligar(core) { C = core; },
    responder,
    _teste: { converterValores, corrigir, valorDe, dataDe, horaDe, limpar, categoriaDe }
  };
})();

