# ABWSERVICES

Site profissional da ABW Marido de Aluguel com:
- pagina publica de servicos e orcamento
- painel admin com login restrito
- controle de pedidos pendentes e realizados
- avaliacoes publicas de clientes

## Deploy no Render (publico)

1. No Render, clique em `New +` -> `Blueprint`.
2. Conecte este repositorio: `https://github.com/ABWSERVICOS/ABWSERVICES.git`.
3. O Render vai ler o `render.yaml` automaticamente.
4. Preencha as variaveis obrigatorias:
   - `ADMIN_EMAIL` (seu email de acesso admin)
   - `DB_HOST`
   - `DB_PORT` (3306, se usar MySQL padrao)
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
5. Clique em `Apply`.
6. Quando terminar o deploy, abra a URL gerada no Render.

## Banco de dados

O app usa MySQL. Voce pode usar:
- Railway MySQL
- PlanetScale
- Aiven
- Hostinger/MySQL remoto

Depois de criar o banco, execute estas tabelas (se ainda nao existirem):

```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100),
  senha VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100),
  endereco VARCHAR(255),
  descricao TEXT,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pendente',
  data_servico DATE
);
```

Obs: a tabela `avaliacoes` e criada automaticamente pela API.
