-- ==========================================
-- SCRIPT DE CRIAÇÃO DA TABELA DO SUPABASE
-- XIII Fórum de Inovação e Tecnologia (FIT 2026)
-- ==========================================

-- 1. Criação da tabela de links
CREATE TABLE IF NOT EXISTS fit_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT NOT NULL,
    style_class TEXT NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ativação de RLS (Row Level Security) para segurança
ALTER TABLE fit_links ENABLE ROW LEVEL SECURITY;

-- 3. Criação de política para leitura pública (qualquer pessoa pode ver os links ativos)
CREATE POLICY "Permitir leitura pública para links ativos" 
ON fit_links 
FOR SELECT 
USING (active = true);

-- 4. Inserção dos links iniciais oficiais do FIT 2026
INSERT INTO fit_links (title, url, icon, style_class, order_index, active) VALUES
('Formulário: Perfil Gamer', 'https://forms.gle/perfil-gamer-fit2026', 'fas fa-gamepad', 'link-gamer', 1, true),
('Garantir Minha Inscrição', 'https://fit.crateus.ufc.br/#inscricoes', 'fas fa-ticket-alt', 'link-orange', 2, true),
('Site Oficial FIT 2026', 'index.html', 'fas fa-globe', 'link-blue', 3, true),
('Voluntários (Inscrições Encerradas)', 'https://forms.gle/WrNpp3KVtz7iWyfe7', 'fas fa-hands-helping', 'link-gray', 4, true),
('Edição FIT 2025', 'https://fit.crateus.ufc.br/ano/2025', 'fas fa-history', 'link-gray', 5, true);
