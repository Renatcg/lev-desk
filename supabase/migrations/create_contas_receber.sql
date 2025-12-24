-- Tabela para lotes de contas a receber
CREATE TABLE IF NOT EXISTS contas_receber_lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_economico_id UUID NOT NULL REFERENCES grupos_economicos(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabela para registros individuais de contas a receber
CREATE TABLE IF NOT EXISTS contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id UUID NOT NULL REFERENCES contas_receber_lotes(id) ON DELETE CASCADE,
  grupo_economico_id UUID NOT NULL REFERENCES grupos_economicos(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para melhor performance
CREATE INDEX idx_contas_receber_lotes_grupo ON contas_receber_lotes(grupo_economico_id);
CREATE INDEX idx_contas_receber_lotes_projeto ON contas_receber_lotes(projeto_id);
CREATE INDEX idx_contas_receber_grupo ON contas_receber(grupo_economico_id);
CREATE INDEX idx_contas_receber_projeto ON contas_receber(projeto_id);
CREATE INDEX idx_contas_receber_lote ON contas_receber(lote_id);
CREATE INDEX idx_contas_receber_data ON contas_receber(data_cobranca);
