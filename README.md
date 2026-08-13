# Maja

Sistema sencillo para administrar un taller de tejido.

Permite registrar:

- Ventas.
- Gastos.
- Clientes.
- Inventario de lana.
- Análisis del negocio con Gemini.

## Requisitos

- Node.js instalado.
- Un proyecto de Supabase.
- Una clave de la API de Gemini.

## Instalación

Clona el repositorio e instala las dependencias:

```bash
git clone https://github.com/jairoteran/maja-tejido-mvp.git
cd maja-tejido-mvp
npm install
```

Copia `.env.example` como `.env.local` y completa las claves:

```env
GEMINI_API_KEY=tu_clave_de_gemini
GEMINI_MODEL=gemini-3.6-flash

NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_clave_publicable
NEXT_PUBLIC_AUTH_USERNAME=tu_usuario
NEXT_PUBLIC_AUTH_EMAIL=correo_del_usuario_en_supabase
```

No subas `.env.local` a GitHub.

## Configurar Supabase

En **Supabase → SQL Editor**, ejecuta estos archivos en orden:

1. `supabase/migrations/202608130001_create_maja_state.sql`
2. `supabase/migrations/202608130002_secure_with_auth.sql`

Después, en **Authentication → Users**, crea o confirma el correo indicado en `NEXT_PUBLIC_AUTH_EMAIL`. La contraseña se configura directamente en Supabase.

## Iniciar

```bash
npm run dev
```

Abre la dirección que aparece en la terminal, normalmente:

```text
http://localhost:5173
```

Inicia sesión con el usuario configurado en Supabase.

## Uso

- **Inicio:** muestra ingresos, gastos y ganancia.
- **Ventas:** registra los pedidos vendidos.
- **Gastos:** registra compras de lana, herramientas y otros materiales.
- **Clientes:** guarda los datos de los compradores.
- **Inventario:** controla los ovillos y muestra alertas de stock bajo.
- **Mi contador IA:** responde preguntas utilizando los datos registrados.

Los datos se guardan en Supabase. El navegador conserva una copia local como respaldo.

## Otros comandos

```bash
npm run build
npm run lint
```

El análisis de la IA es orientativo y no reemplaza asesoría contable o tributaria profesional.
