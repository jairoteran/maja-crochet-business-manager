# Maja — contabilidad para un taller de tejido

MVP web en React y TypeScript para registrar ventas, gastos, clientes e inventario de lana. Incluye un panel financiero y un asistente que interpreta los registros en lenguaje sencillo.

## Ejecutar

```bash
npm install
npm run dev
```

La información se guarda en `localStorage`, por lo que permanece en el mismo navegador. Los datos iniciales son demostrativos.

## Gemini en local

El asistente consulta Gemini a través de `/api/ai`; la clave nunca se envía al navegador. Crea `.env.local` a partir de `.env.example` y añade una clave de Google AI Studio:

```env
GEMINI_API_KEY=tu_clave
GEMINI_MODEL=gemini-3.6-flash
```

`.env.local` está excluido del control de versiones. Si Gemini falla, la interfaz muestra un análisis local básico y lo identifica claramente.

## Supabase

La app intenta cargar y guardar el estado en Supabase y conserva `localStorage` como respaldo. Antes del primer uso, ejecuta en **Supabase → SQL Editor** el archivo:

`supabase/migrations/202608130001_create_maja_state.sql`

Después configura estas variables en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_tu_clave
```

La política incluida es provisional para probar un taller de una sola usuaria. Permite acceso anónimo al registro y debe sustituirse por Supabase Auth y políticas por usuario antes de cargar datos reales o publicar la aplicación.

### Activar el acceso privado

1. En **Authentication → Users**, confirma la cuenta técnica asociada a `Margarita68`.
2. Ejecuta `supabase/migrations/202608130002_secure_with_auth.sql` en el SQL Editor.

La aplicación muestra únicamente el nombre de usuario; Supabase gestiona la contraseña, la sesión y su persistencia. La segunda migración revoca el acceso anónimo y limita cada registro a `auth.uid()`.

## Comandos

- `npm run dev`: servidor de desarrollo.
- `npm run build`: compilación de producción.
- `npm run lint`: validación estática.

## Alcance actual

- Panel con ingresos, gastos, ganancia y actividad reciente.
- Registro de ventas y actualización automática del historial del cliente.
- Registro de compras y otros gastos por categoría.
- Directorio de clientes.
- Inventario de ovillos con alertas de stock bajo.
- Análisis financiero conversacional con Gemini y respaldo local.

Para convertirlo en un producto multiusuario hacen falta autenticación, base de datos, copias de seguridad y un backend desplegado que proteja la clave. La orientación mostrada no reemplaza asesoría tributaria profesional.
