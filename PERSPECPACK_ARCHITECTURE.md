# PERSPECPACK - Arquitetura do Sistema

## 1. Visão Geral da Arquitetura
O PERSPECPACK é desenvolvido como uma Single Page Application (SPA), baseada em React (Vite) no AI Studio, com integração contínua para um back-end gerenciado pelo Supabase. A estruturação foi planejada para que a migração para **Next.js 15 (App Router)** seja natural e contínua em caso de deployment como SSR/SSG.

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite, React Router, Tailwind CSS 4
- **Componentes**: Shadcn/UI (Radix UI), Lucide Icons
- **Gerenciamento de Estado**: Context API / Estado local (React Hook Form + Zod)
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)

## 2. Estrutura de Pastas (Front-End)

```text
/
├── src/
│   ├── assets/           # Imagens, SVGs e recursos estáticos
│   ├── components/       # Componentes globais
│   │   ├── layout/       # Componentes de layout (Sidebar, Header)
│   │   ├── ui/           # Acervo do Shadcn/UI
│   │   └── shared/       # Componentes reutilizáveis do domínio
│   ├── config/           # Configurações gerais (menus, constantes)
│   ├── hooks/            # Custom Hooks
│   ├── lib/              # Utilitários (Supabase client, classes tailwind)
│   ├── pages/            # View/Páginas mapeando as rotas da aplicação
│   │   ├── auth/         # Login, Recuperar Senha
│   │   ├── dashboard/    # Visão geral
│   │   ├── oems/         # Gestão de Montadoras
│   │   ├── components/   # Gestão de Componentes Homologados
│   │   ├── documents/    # Normas, Encargos
│   │   ├── checklists/   # Checklists dinâmicos
│   │   └── projects/     # Projetos (Referência, Em desenvolvimento)
│   ├── types/            # Definições de Tipagem TypeScript abstratas
│   ├── App.tsx           # Configuração de Rotas e Providers
│   └── main.tsx          # Entrypoint React
├── supabase/
│   ├── migrations/       # Scripts SQL para o BD
│   └── seed.sql          # Dados iniciais para inicialização rápida
└── vite.config.ts        # Setup do empacotador
```

## 3. Banco de Dados (PostgreSQL no Supabase)

### Tabelas Principais:

* **users** & **profiles**: (Gerenciado pelo Supabase Auth + extensões)
* **oems**: `id`, `name`, `created_at`
* **components**: `id`, `name`, `category`, `oem_id`, `description`, `step_url`, `pdf_url`, `dwg_url`, `image_url`, `revision`, `status`, `created_at`
* **documents**: `id`, `title`, `oem_id`, `category`, `revision`, `date`, `file_url`, `created_at`
* **checklists**: `id`, `oem_id`, `name`, `created_at`
* **checklist_items**: `id`, `checklist_id`, `category`, `description`, `is_mandatory`
* **projects**: `id`, `name`, `client`, `oem_id`, `responsible_id`, `status`, `checklist_id`, `created_at`
* **project_evaluations**: `id`, `project_id`, `checklist_item_id`, `status` (conforme/não conforme/NA), `notes`

## 4. Módulos da Aplicação

1. **Dashboard**: Panorama geral, KPIs de projetos e componentes.
2. **OEMs**: Hub central com visão segmentada por montadora (VW, Scania, Hyundai, etc...).
3. **Componentes**: Catálogo técnico com visualização ou listagem de CAD (STEP, DWG, PDF).
4. **Documentos**: Acervo de Cadernos de Encargos e Normas, filtrado por OEM.
5. **Checklists**: Engine de templates de inspeção baseados nas diretrizes do OEM.
6. **Projetos & Relatórios**: Gerenciamento de submissões e auditoria para relatórios finais de conformidade.

> *Nota: Os schemas SQL completos estão documentados na pasta do projeto.*
