# Broadcast

**Link da aplicação:** https://broadcast-adec0.web.app

## Stack

- React 19 + Typescript + Vite
- Material UI + TailwindCSS
- Firebase Authentication, Firestore e Cloud Functions
- Paradigma funcional

## O que a aplicação faz

- Cadastro e login de usuário
- CRUD **Conexões** (Nome)
- CRUD **Contatos** (Nome, telefone) - Separado por conexão
- **Broadcast**: Seleciona Um ou mais contatos da conexão selecionada, escreve a mensagem e envia na hora ou agenda para uma data futura
- Histórico de mensagens com filtro entre enviadas e agendadas, edição e exclusão
- Uma mensagem agendada passa de status `Scheduled` para `Sent` automaticamente sem depender de o usuário estar com a aplicação aberta

## Estrutura do projeto

```
/
├─ firebase.json
├─ firestore.rules            # Security Rules (isolamento entre clientes)
├─ firestore.indexes.json     # índice composto da Function de agendamento
├─ functions/                 # Cloud Functions
│  └─ src/
│     ├─ index.ts
│     ├─ sendScheduled.ts     # agendada: scheduled -> sent
│     └─ cascadeDelete.ts     # exclusão em cascata de uma conexão
│     └─ createMessage.ts     # criação do envio da mensagem
│     └─ updateMessage.ts     # edição da mensagem
│     ├─ deleteContact.ts     # exclusão de contatos e limpeza dos agendamentos
│     └─ messageValidation.ts # exclusão em cascata de uma conexão
└─ web/                       # frontend (Vite)
   └─ src/
      ├─ lib/firebase.ts      # único ponto de inicialização do Firebase
      ├─ routes/              # telas e rota protegida
      ├─ components/layout/
      └─ features/
         ├─ auth/
         ├─ connections/
         ├─ contacts/
         └─ messages/
```

Cada feature segue o mesmo padrão:

- `api.ts`: funções de acesso ao Firestore para CRUD e listeners.
- `hooks.ts`: hooks que assinam o `onSnapshot` e devolvem os dados, com cleanup do listener.
- `types.ts`: tipos dos documentos.
- `components/`: apenas interface.

## Modelagem de dados

Collections planas na raiz do Firestore sem usar subcoleções.
Todo documento carrega `ownerId` (o `uid` do cliente no Firebase Auth).
A hierarquia cliente → conexão → contatos e mensagens é feita por referência de ID (`connectionId`).

| Collection    | Campos                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `connections` | `ownerId`, `name`, `createdAt`, `updatedAt`                                                                                               |
| `contacts`    | `ownerId`, `connectionId`, `name`, `phone`, `createdAt`, `updatedAt`                                                                      |
| `messages`    | `ownerId`, `connectionId`, `contactIds[]`, `content`, `status` (`scheduled` ou `sent`), `scheduledAt`, `sentAt`, `createdAt`, `updatedAt` |

Os destinatários ficam como um array (`contactIds`) dentro da própria mensagem sem necessidade de collection associativa e evita subcoleção

## Isolamento entre clientes (multi-tenancy)

O isolamento é garantido no servidor pelas Security Rules (`firestore.rules`).

1. Todo documento tem `ownerId` e as rules só liberam leitura, edição e exclusão quando `ownerId == request.auth.uid`
2. Toda query do frontend filtra por `ownerId` (sem o filtro, a consulta é rejeitada)
3. `ownerId` e `connectionId` são imutáveis depois da criação
4. As Rules bloqueiam a criação e a edição direta de mensagens (`allow create, update: if false`). Essas operações são realizadas exclusivamente pelas Cloud Functions `createMessage` e `updateMessage`, que validam a autenticação, a propriedade da conexão, o vínculo dos contatos com a conexão e os dados da mensagem. Para a criação de contatos, as Rules verificam, via `get()`, se a conexão pertence ao usuário
5. Só as Functions gravam o status: criam como `sent` ou `scheduled` com data futura, e só o agendador altera de `scheduled` para `sent`
6. A exclusão de contatos é realizada pela Cloud Function `deleteContact`, que valida a propriedade do contato antes de executar a exclusão e atualizar as mensagens agendadas relacionadas

## Cloud Functions

- **`sendScheduledMessages`**: roda a cada minuto, busca mensagens com `status == "scheduled"` e `scheduledAt <= agora` (limite de 500 por execução) e altera o status para `sent`, gravando `sentAt`. Usa o índice composto `status` + `scheduledAt`
- **`cascadeDelete`**: ao excluir uma conexão os contatos e as mensagens com aquele `connectionId` são apagados. Sem subcoleções e sem chaves estrangeiras, a Function cumpre o papel de um `ON DELETE CASCADE`
- **`createMessage`** (callable): cria a mensagem no backend. Valida a autenticação, que a conexão pertence ao usuário e que todos os contatos pertencem àquela conexão e grava como `sent` ou `scheduled`
- **`updateMessage`** (callable): edita texto, data e destinatários de uma mensagem ainda agendada com as mesmas validações dentro de uma transação para não competir com o envio automático
- **`deleteContact`** (callable): exclui um contato e atualiza as mensagens agendadas que o incluem, Remove o contato de `contactIds` quando existem outros destinatários ou exclui o agendamento quando ele era o único destinatário com mensagens já enviadas sendo preservadas

## Tempo real

Todas as listas usam `onSnapshot` assim todas alterações feitas em outra aba ou computador, ou pela Function de agendamento, aparecem sem recarregar a página

## Concorrência

- `updateMessage` e `deleteContact` usam transações e reconferem o status da mensagem dentro delas
- O agendador reconfere cada mensagem em uma transação antes de marcá-la como `sent` então uma edição ou um reagendamento simultâneo não é sobrescrito e execuções sobrepostas não enviam duas vezes
- A exclusão de contato limpa as mensagens primeiro e remove o contato por último, o que permite repetir a operação se ela falhar no meio

## Decisões

- **`ownerId` desnormalizado em todas as collections** (sem subcoleções) É ele que permite regras simples e segurança nas queries
- **Edição só de mensagens agendadas.** Mensagens enviadas só podem ser excluídas. Nas agendadas é possível alterar o texto, a data e os destinatários, e a Function updateMessage exige que a mensagem continue `scheduled` com data futura
- **A Function é a única que marca como enviada** as mensagens agendadas
- **Validação de mensagens no backend** as Cloud Functions validam o conteúdo (de 1 a 1.000 caracteres), exigem entre 1 e 500 destinatários únicos e verificam se todos pertencem à conexão do usuário. Para mensagens agendadas, também exigem uma data futura. O frontend pode validar os dados para melhorar a experiência de uso, mas a validação efetiva ocorre no backend. As Firestore Rules impedem a criação e a edição direta de mensagens
- **Exclusão de contatos:** as referências aos contatos excluídos são removidas das mensagens agendadas e Quando não restam destinatários a mensagem é excluída com o histórico das mensagens enviadas sendo preservado
- **Interface em inglês.** O código e a interface estão em inglês porque o projeto também serve como portfólio pessoal, Os status gravados são `scheduled` e `sent`, exibidos como "Scheduled" e "Sent" ("Agendada" e "Enviada")

## Limitações

- O agendamento tem precisão de cerca de 1 minuto
- Os horários usam o fuso do navegador
- As listas não têm paginação
- Não há recuperação de senha
- Edições simultâneas da mesma mensagem em duas abas a "última gravação vence"
- Uma criação ou edição de mensagem exatamente ao mesmo tempo que a exclusão de um contato ou de uma conexão pode deixar uma referência órfã sem efeito no restante dos dados

## Como rodar

Requisitos: Node 20 ou superior e `firebase-tools` (`npm i -g firebase-tools`).

```bash
cd web
cp .env.example .env     # As chaves do app web do Firebase precisam ser preenchidas
npm install
npm run dev
```

O `.env` usa as variáveis `VITE_apiKey`, `VITE_authDomain`, `VITE_projectId`, `VITE_storageBucket`, `VITE_messagingSenderId` e `VITE_appId`

## Deploy

As Cloud Functions exigem o plano Blaze do Firebase.

```bash
cd web && npm run build && cd ..
firebase deploy            # hosting, functions, rules e índices
```

Para publicar partes separadas: `firebase deploy --only hosting`, `--only functions` ou `--only firestore`. O índice composto pode levar alguns minutos antes de ativar
