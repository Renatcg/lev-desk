# Setup do Supabase - LEV Sistema

Este documento contém todos os comandos SQL necessários para configurar o banco de dados do LEV no Supabase, em ordem cronológica de implementação.

## Instruções Gerais

1. Acesse o Supabase em: https://app.supabase.com/project/yyybnzgnfdcnhcluiduh/sql/new
2. Execute cada comando SQL abaixo na ordem apresentada
3. Aguarde a conclusão de cada comando antes de prosseguir para o próximo

---

## FASE 1: Tabelas de Contas a Receber (Já Criadas)

Estas tabelas já foram criadas. Se precisar recriar, execute:

```sql
CREATE TABLE IF NOT EXISTS contas_receber_lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_economico_id UUID NOT NULL,
  projeto_id UUID NOT NULL,
  base_cobranca VARCHAR(20) NOT NULL CHECK (base_cobranca IN ('mensal', 'bimestral', 'trimestral', 'semestral')),
  valor_cobranca DECIMAL(15, 2) NOT NULL,
  tipo_cobranca VARCHAR(20) NOT NULL CHECK (tipo_cobranca IN ('pre-pago', 'pos-pago')),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dia_pagamento INTEGER NOT NULL CHECK (dia_pagamento >= 1 AND dia_pagamento <= 31),
  dia_emissao_nota INTEGER NOT NULL CHECK (dia_emissao_nota >= 1 AND dia_emissao_nota <= 31),
  contato_nome VARCHAR(255) NOT NULL,
  contato_email VARCHAR(255) NOT NULL,
  contato_telefone VARCHAR(20) NOT NULL,
  descricao TEXT,
  total_registros INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID NOT NULL REFERENCES contas_receber_lotes(id) ON DELETE CASCADE,
  grupo_economico_id UUID NOT NULL,
  projeto_id UUID NOT NULL,
  base_cobranca VARCHAR(20) NOT NULL CHECK (base_cobranca IN ('mensal', 'bimestral', 'trimestral', 'semestral')),
  valor_cobranca DECIMAL(15, 2) NOT NULL,
  tipo_cobranca VARCHAR(20) NOT NULL CHECK (tipo_cobranca IN ('pre-pago', 'pos-pago')),
  data_cobranca DATE NOT NULL,
  dia_pagamento INTEGER NOT NULL CHECK (dia_pagamento >= 1 AND dia_pagamento <= 31),
  dia_emissao_nota INTEGER NOT NULL CHECK (dia_emissao_nota >= 1 AND dia_emissao_nota <= 31),
  contato_nome VARCHAR(255) NOT NULL,
  contato_email VARCHAR(255) NOT NULL,
  contato_telefone VARCHAR(20) NOT NULL,
  descricao TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'emitida', 'paga', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_contas_receber_lotes_grupo ON contas_receber_lotes(grupo_economico_id);
CREATE INDEX idx_contas_receber_lotes_projeto ON contas_receber_lotes(projeto_id);
CREATE INDEX idx_contas_receber_grupo ON contas_receber(grupo_economico_id);
CREATE INDEX idx_contas_receber_projeto ON contas_receber(projeto_id);
CREATE INDEX idx_contas_receber_lote ON contas_receber(lote_id);
CREATE INDEX idx_contas_receber_data ON contas_receber(data_cobranca);
```

---

## FASE 2: Tabelas de Contas a Pagar (Próximas a Criar)

Execute este SQL para criar as tabelas de contas a pagar:

```sql
CREATE TABLE IF NOT EXISTS contas_pagar_lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_cobranca VARCHAR(20) NOT NULL CHECK (base_cobranca IN ('mensal', 'bimestral', 'trimestral', 'semestral')),
  valor_despesa DECIMAL(15, 2) NOT NULL,
  tipo_pagamento VARCHAR(20) NOT NULL CHECK (tipo_pagamento IN ('pre-pago', 'pos-pago')),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dia_pagamento INTEGER NOT NULL CHECK (dia_pagamento >= 1 AND dia_pagamento <= 31),
  dia_emissao_nota INTEGER NOT NULL CHECK (dia_emissao_nota >= 1 AND dia_emissao_nota <= 31),
  fornecedor_nome VARCHAR(255) NOT NULL,
  fornecedor_email VARCHAR(255) NOT NULL,
  fornecedor_telefone VARCHAR(20) NOT NULL,
  descricao TEXT,
  total_registros INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID NOT NULL REFERENCES contas_pagar_lotes(id) ON DELETE CASCADE,
  base_cobranca VARCHAR(20) NOT NULL CHECK (base_cobranca IN ('mensal', 'bimestral', 'trimestral', 'semestral')),
  valor_despesa DECIMAL(15, 2) NOT NULL,
  tipo_pagamento VARCHAR(20) NOT NULL CHECK (tipo_pagamento IN ('pre-pago', 'pos-pago')),
  data_vencimento DATE NOT NULL,
  dia_pagamento INTEGER NOT NULL CHECK (dia_pagamento >= 1 AND dia_pagamento <= 31),
  dia_emissao_nota INTEGER NOT NULL CHECK (dia_emissao_nota >= 1 AND dia_emissao_nota <= 31),
  fornecedor_nome VARCHAR(255) NOT NULL,
  fornecedor_email VARCHAR(255) NOT NULL,
  fornecedor_telefone VARCHAR(20) NOT NULL,
  descricao TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX idx_contas_pagar_lote ON contas_pagar(lote_id);
CREATE INDEX idx_contas_pagar_vencimento ON contas_pagar(data_vencimento);
CREATE INDEX idx_contas_pagar_status ON contas_pagar(status);
```

---

## FASE 3: Campos Adicionais para Conciliação Bancária

Execute este SQL para adicionar campos necessários para o registro de pagamentos:

```sql
ALTER TABLE contas_receber ADD COLUMN IF NOT EXISTS data_pagamento DATE;
ALTER TABLE contas_receber ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(15, 2);
ALTER TABLE contas_receber ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(50);

ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS data_pagamento DATE;
ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(15, 2);
ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(50);

CREATE INDEX idx_contas_receber_data_pagamento ON contas_receber(data_pagamento);
CREATE INDEX idx_contas_receber_status ON contas_receber(status);
CREATE INDEX idx_contas_pagar_data_pagamento ON contas_pagar(data_pagamento);
CREATE INDEX idx_contas_pagar_status ON contas_pagar(status);
```

---

## FASE 4: Tabelas de Dashboard (Futuro)

Quando implementar o dashboard financeiro, execute:

```sql
CREATE TABLE IF NOT EXISTS financeiro_resumo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  receita_realizada DECIMAL(15, 2) DEFAULT 0,
  receita_a_realizar DECIMAL(15, 2) DEFAULT 0,
  receita_inadimplencia DECIMAL(15, 2) DEFAULT 0,
  despesa_realizada DECIMAL(15, 2) DEFAULT 0,
  despesa_a_realizar DECIMAL(15, 2) DEFAULT 0,
  despesa_inadimplencia DECIMAL(15, 2) DEFAULT 0,
  lucro_realizado DECIMAL(15, 2) DEFAULT 0,
  lucro_projetado DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ano, mes)
);

CREATE INDEX idx_financeiro_resumo_ano_mes ON financeiro_resumo(ano, mes);
```

---

## FASE 5: RLS (Row Level Security) - Opcional

Para adicionar segurança, execute quando estiver pronto:

```sql
ALTER TABLE contas_receber_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own records" ON contas_receber_lotes
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own records" ON contas_receber_lotes
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own records" ON contas_receber_lotes
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own records" ON contas_receber_lotes
  FOR DELETE USING (created_by = auth.uid());
```

---

## Checklist de Implementação

- [x] FASE 1: Contas a Receber (já criada)
- [ ] FASE 2: Contas a Pagar
- [ ] FASE 3: Campos de Conciliação Bancária
- [ ] FASE 4: Tabelas de Dashboard
- [ ] FASE 5: RLS (Row Level Security)

---

## Notas Importantes

1. **Ordem Cronológica**: Execute os comandos na ordem apresentada
2. **Dependências**: Algumas tabelas dependem de outras (ex: contas_receber depende de contas_receber_lotes)
3. **Índices**: Os índices melhoram a performance das queries
4. **RLS**: Adicione apenas quando tiver certeza da estrutura

---

## Suporte

Se encontrar erros ao executar os comandos SQL, verifique:
- Se a tabela já existe (use `IF NOT EXISTS`)
- Se as referências de chaves estrangeiras estão corretas
- Se os tipos de dados estão corretos

