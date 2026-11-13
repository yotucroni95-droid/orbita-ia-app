const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const context={window:{},Date,console};vm.createContext(context);
vm.runInContext(fs.readFileSync(__dirname+'/base-conhecimento.js','utf8'),context);
vm.runInContext(fs.readFileSync(__dirname+'/assistente.js','utf8'),context);
const bot=context.window.OrbitaAssistente;
for(const [input,expected] of [
 ['anote mil reais que eu recebi',1000],['gastei quatrocentos com gasolina',400],
 ['recebi dois mil e quinhentos reais',2500],['gastei vinte e cinco reais e cinquenta centavos',25.50],
 ['gastei cinquenta centavos',.5],['gastei 45 no mercado dia 20',45],
 ['recebi 1.234,56',1234.56],['resebi mil reais',1000],
 ['gastey quatrocentos com gazolina',400],['gastei no mercado',null],
 ['recebi de um cliente',null],['gastei cem reais ontem',100],
 ['recebi um milhao e duzentos mil',1200000]
])assert.equal(bot._teste.valorDe(input),expected,input);
let state={tx:[],eventos:[],tarefas:[],metas:[],memoria:[],chat:[],orc:{}},calls=[];
bot.ligar({S:()=>state,money:n=>'R$ '+n,tool:(name,p)=>{calls.push([name,p]);const row={id:String(calls.length),...p};if(name==='registrar_lancamento')state.tx.push(row);if(name==='criar_tarefa')state.tarefas.push(row);if(name==='memorizar')state.memoria.push({id:row.id,texto:p.fato});}});
bot.responder('anote mil reais que eu recebi');assert.equal(state.tx[0].valor,1000);assert.equal(state.tx[0].tipo,'entrada');
bot.responder('gastey quatrocentos com gazolina');assert.equal(state.tx[1].valor,400);assert.equal(state.tx[1].categoria,'Transporte');
bot.responder('tenho que ligar pro fornecedor amanhã');assert.equal(state.tarefas.length,1);
bot.responder('anota que o fornecedor entrega toda terça');assert.equal(state.memoria.length,1);
bot.responder('quanto gastei com gasolina?');assert.equal(state.tx.length,2);
console.log('Valores por extenso, erros comuns, entrada/saída, tarefa, anotação e consulta: OK');

const examples = [
['Olá, tudo bem?','pronto para ajudar'],['td bem','pronto para ajudar'],['oi','Como posso ajudar'],['boa tarde','Como posso ajudar'],['valeu','Por nada'],['tchau','Até mais'],
['quem é você?','respostas programadas'],['você é IA?','Não sou uma IA generativa'],['funciona offline?','sem internet'],['como fazer backup?','Restaurar backup'],['você sabe tudo?','não aprendo sozinho'],['pode me avisar com app fechado?','não garante alertas'],
['como vender mais?','teste pequeno'],['como aumentar as vendas?','teste pequeno'],['como atrair clientes?','teste pequeno'],['como posso ajudar minha empresa?','quatro hábitos'],['como melhorar minha loja?','quatro hábitos'],['como divulgar minha loja?','divulgação'],['o que postar no instagram?','divulgação'],['como melhorar atendimento?','Ouça'],['como lidar com reclamações?','Ouça'],['como controlar estoque?','Liste'],['como negociar com fornecedor?','Compare'],['como definir preço?','custo'],['como fazer promoção?','custo'],['como organizar minhas finanças?','Registre'],['como gastar menos?','Registre'],['o que é lucro?','Faturamento'],['qual diferença entre lucro e saldo?','Faturamento'],['como organizar meu dia?','três prioridades'],['como criar meta de mil reais?','objetivo específico'],['como liderar equipe?','resultado esperado'],['como evitar golpe?','Desconfie'],['me conte uma curiosidade','polvo'],['por que o céu é azul?','moléculas'],['como abelhas se comunicam?','dança'],['o que é ano bissexto?','366'],['como funciona o ciclo da água?','evapora'],['o que é fotossíntese?','açúcares'],['vai chover amanhã?','Não consulto'],['qual remédio tomar?','profissional'],['me conte uma piada','matemática'],
['quem inventou o telescópio?','base local'],['texto aleatório incompreensível','Não'],['quanto gastei com gasolina?','400']
];
const before=JSON.stringify(state),count=calls.length;
for(const [q,expected] of examples){const answer=bot.responder(q);assert.ok(answer.includes(expected),q+' => '+answer);}
assert.equal(JSON.stringify(state),before);assert.equal(calls.length,count);
console.log(examples.length+' simulações de conversa/consulta sem alterar registros: OK; '+context.window.OrbitaConhecimento.itens.length+' tópicos.');
