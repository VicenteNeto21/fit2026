-- ── TABELA DE OFÍCIOS GERADOS ──
CREATE TABLE IF NOT EXISTS oficios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT NOT NULL,
    data_local TEXT NOT NULL,
    assunto TEXT NOT NULL,
    tratamento TEXT NOT NULL,
    destinatario TEXT NOT NULL,
    cargo TEXT NOT NULL,
    organizacao TEXT NOT NULL,
    rua TEXT,
    cep TEXT,
    vocativo TEXT NOT NULL,
    corpo TEXT NOT NULL,
    responsavel TEXT NOT NULL,
    responsavel_cargo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── SEGURANÇA E POLÍTICAS RLS ──
ALTER TABLE oficios ENABLE ROW LEVEL SECURITY;

-- Como ofícios são documentos internos, somente administradores podem ler e escrever
CREATE POLICY "Acesso completo por admin autenticado nos oficios" ON oficios 
    FOR ALL USING (auth.role() = 'authenticated');
