# ERP - INTELIGENCIA CONTÁBIL

Quero criar a fundação de um novo ERP Contábil, separado de qualquer outro projeto existente.

O objetivo inicial é construir a estrutura visual e funcional de um ERP contábil próprio, que primeiro servirá como contingência ao Questor e futuramente poderá substituir o Questor para determinadas empresas.

Nesta etapa, NÃO implemente motor contábil real, NÃO conecte API externa, NÃO crie lógica pesada de importação e NÃO automatize lançamentos.

Quero apenas a arquitetura visual e navegação principal.

Crie uma aplicação moderna, profissional e limpa, com:

 Dashboard

 Empresas

 Grupos de Empresas

 Contábil

 Importações

 Integrações

 Relatórios

 Administração

Dentro de Contábil, prever as rotas/telas:

 Competências

 Plano de Contas

 Centros de Custo

 Históricos Contábeis

 Lançamentos

 Lotes

 Rateios

 Conciliação

 Fechamento

 Encerramento

 Razão

 Diário

 Balancete

 DRE

 Balanço Patrimonial

Também criar como módulos futuros, sem implementação:

 Fiscal

 Patrimônio

 ECD / ECF

 Obrigações Acessórias

Requisitos de navegação:

 seletor global de empresa;

 seletor global de competência;

 identificação clara da empresa selecionada;

 sidebar fixa e organizada;

 filtros acessíveis;

 tabelas preparadas para alto volume;

 busca;

 paginação;

 design responsivo;

 estrutura preparada para permissões por usuário e função.

Na área de Importações, apenas crie a interface conceitual prevendo futuramente:

 TXT

 CSV

 XLSX

 OFX

 PDF

 XML

 API

Na área de Integrações, prever futuramente um conector para Questor.

Importante:

 não criar dados fictícios excessivos;

 não implementar regras contábeis ainda;

 não criar integração real com Questor ainda;

 não criar automações pesadas;

 não tentar construir o ERP inteiro nesta etapa.

Antes de executar mudanças extensas, apresente primeiro a arquitetura de telas, rotas e entidades sugeridas.

Depois que o Lovable montar isso, aí conectamos ao repositório ERP-INTELIGENCIA-CONTABIL. Esse caminho é o mais seguro agora.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9b396cdd-993d-4f61-ae87-20d5e2d5e8e5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
