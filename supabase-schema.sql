-- ==========================================
-- SCRIPT DE CRIAÇÃO DO BANCO NO SUPABASE
-- XIII Fórum de Inovação e Tecnologia (FIT 2026)
-- Unificação total: Links + Palestrantes + Patrocinadores
-- ==========================================

-- ── 1. TABELA DE LINKS ÚTEIS (LINKTREE) ──
CREATE TABLE IF NOT EXISTS fit_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    icon TEXT,
    style_class TEXT NOT NULL,
    thumbnail_url TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 2. TABELA DE PALESTRANTES ──
CREATE TABLE IF NOT EXISTS palestrantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cargo TEXT,
    tema TEXT,
    foto TEXT,
    ordem INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 3. TABELA DE PATROCINADORES ──
CREATE TABLE IF NOT EXISTS patrocinadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    tier TEXT CHECK (tier IN ('diamante', 'prata', 'midia')) NOT NULL,
    logo TEXT,
    ordem INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ── 4. SEGURANÇA E POLÍTICAS RLS (Row Level Security) ──

-- Habilitar RLS em todas as tabelas
ALTER TABLE fit_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE palestrantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrocinadores ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública (qualquer visitante pode ver)
CREATE POLICY "Leitura pública de links ativos" ON fit_links FOR SELECT USING (active = true);
CREATE POLICY "Leitura pública de palestrantes" ON palestrantes FOR SELECT USING (true);
CREATE POLICY "Leitura pública de patrocinadores" ON patrocinadores FOR SELECT USING (true);

-- Políticas de escrita e modificação (para administradores autenticados via Supabase Auth)
-- Nota: Estas políticas permitem modificações apenas para usuários logados
CREATE POLICY "Modificações por admin autenticado no fit_links" ON fit_links 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Modificações por admin autenticado nos palestrantes" ON palestrantes 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Modificações por admin autenticado nos patrocinadores" ON patrocinadores 
    FOR ALL USING (auth.role() = 'authenticated');

-- ── 5. REGISTROS INICIAIS (FIT 2026) ──

-- Links Úteis
INSERT INTO fit_links (title, description, url, icon, style_class, thumbnail_url, order_index, active) VALUES
('Formulário: Perfil Gamer', 'Inscreva-se no campeonato e monte sua equipe', 'https://forms.gle/perfil-gamer-fit2026', 'fas fa-gamepad', 'link-gamer', NULL, 1, true),
('Garantir Minha Inscrição', 'Acesse a área de inscrições do fórum', 'https://fit.crateus.ufc.br/#inscricoes', 'fas fa-ticket-alt', 'link-orange', NULL, 2, true),
('Site Oficial FIT 2026', 'Acesse o site principal, programação e palestrantes', 'index.html', 'fas fa-globe', 'link-blue', 'fit_2026_avatar.png', 3, true),
('Inscrições para Voluntários', 'Processo encerrado. Obrigado a todos!', 'https://forms.gle/WrNpp3KVtz7iWyfe7', 'fas fa-hands-helping', 'link-gray', NULL, 4, true);

-- Palestrantes Iniciais
INSERT INTO palestrantes (nome, cargo, tema, foto, ordem) VALUES
('Dr. Alan Turing (Exemplo)', 'Pesquisador em IA & Computação', 'IA Generativa e o Futuro do Trabalho', NULL, 1),
('Dra. Ada Lovelace (Exemplo)', 'Especialista em Algoritmos', 'Desafios Éticos da Inteligência Artificial', NULL, 2),
('Prof. John McCarthy (Exemplo)', 'Professor UFC Crateús', 'Machine Learning com Python na Prática', NULL, 3);

-- Patrocinadores Iniciais
INSERT INTO patrocinadores (nome, tier, logo, ordem) VALUES
('Sebrae Crateús', 'diamante', NULL, 1),
('GSIPP Comunicações', 'diamante', NULL, 2),
('EngineLab Inovação', 'prata', NULL, 3),
('SPARC Tech', 'midia', NULL, 4);

-- ── 6. CRIAÇÃO DO USUÁRIO MESTRE (ADMINISTRADOR) ──
-- Habilita a extensão pgcrypto se não estiver ativa (necessária para criptografar a senha)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- Verifica se o usuário já existe no auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'fit@crateus.ufc.br') THEN
        -- Insere na tabela auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token,
            is_super_admin,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at,
            is_sso_user,
            deleted_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            'fit@crateus.ufc.br',
            crypt('fitcrateus', gen_salt('bf')),
            now(),
            NULL,
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            now(),
            now(),
            '',
            '',
            '',
            '',
            false,
            NULL,
            NULL,
            '',
            '',
            '',
            0,
            NULL,
            '',
            NULL,
            false,
            NULL
        );

        -- Insere a identidade correspondente do usuário para compatibilidade com o provedor de e-mail
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            new_user_id,
            jsonb_build_object('sub', new_user_id::text, 'email', 'fit@crateus.ufc.br'),
            'email',
            now(),
            now(),
            now()
        );
    END IF;
END $$;


-- ── 7. CONFIGURAÇÃO DE STORAGE DO SUPABASE (IMAGENS) ──

-- Garantir a criação do bucket 'fit-images' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('fit-images', 'fit-images', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas antigas para evitar erros de duplicidade
DROP POLICY IF EXISTS "Leitura pública de imagens" ON storage.objects;
DROP POLICY IF EXISTS "Upload por admin autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Deleção por admin autenticado" ON storage.objects;

-- Criar política de leitura pública das imagens
CREATE POLICY "Leitura pública de imagens" ON storage.objects
    FOR SELECT USING (bucket_id = 'fit-images');

-- Criar política de upload de novas imagens para admin autenticado
CREATE POLICY "Upload por admin autenticado" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'fit-images' AND auth.role() = 'authenticated');

-- Criar política de remoção de imagens para admin autenticado
CREATE POLICY "Deleção por admin autenticado" ON storage.objects
    FOR DELETE USING (bucket_id = 'fit-images' AND auth.role() = 'authenticated');


