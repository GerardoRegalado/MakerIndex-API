# MakerIndex API - Estrategia de desarrollo

## 1. Resumen del proyecto

MakerIndex API es una API REST/BaaS no oficial para indexar y consultar metadata publica de modelos de MakerWorld. Su objetivo es ofrecer una capa limpia, normalizada y consumible por aplicaciones externas que necesiten descubrir, guardar, comparar o analizar modelos 3D publicados en MakerWorld.

MakerIndex API no es:

- Un espejo de MakerWorld.
- Un downloader de archivos STL, 3MF u otros archivos de modelos.
- Un sistema para redistribuir contenido protegido.
- Un scraper agresivo o de busqueda en vivo.
- Una plataforma con autenticacion de usuarios o billing en la primera version.

La API solo debe trabajar con metadata publica:

- Titulo del modelo.
- URL original del modelo.
- URL del thumbnail, sin almacenar la imagen.
- Datos publicos del creador.
- Estadisticas publicas como descargas, likes, comentarios y boosts.
- Tags y categorias.
- Datos de referencia de print profiles cuando esten disponibles, como tiempo estimado de impresion y gramos estimados de filamento.

Casos de uso principales:

- Resolver URLs de MakerWorld a IDs normalizados.
- Consultar modelos previamente indexados.
- Buscar modelos en una base de datos local con paginacion, sin hacer scraping por cada busqueda.
- Exponer metadata de modelos y print profiles para aplicaciones externas.
- Servir como base tecnica para herramientas de analisis y gestion de produccion 3D.

Relacion con Polymetrix:

Polymetrix sera una futura app que consumira MakerIndex API para permitir que usuarios guarden modelos 3D, los asocien con print profiles, estimen costos, registren cantidades impresas, comparen tiempo/filamento estimado contra resultados reales y mantengan un historial de produccion. MakerIndex API debe mantenerse independiente, limpia y enfocada en metadata publica para que Polymetrix pueda construir funcionalidades de usuario encima sin acoplarse al scraping ni al formato interno de MakerWorld.

## 2. Stack tecnico

Stack principal:

- Node.js como runtime.
- TypeScript como lenguaje base.
- Fastify para la API REST.
- Prisma como ORM.
- Supabase Postgres como base de datos.
- Zod para validacion de inputs, query params y DTOs.
- Playwright mas adelante para scraping conservador y puntual.
- Swagger/OpenAPI para documentacion interactiva.
- Vitest para unit tests e integration tests ligeros.
- pnpm como package manager.

Dependencias recomendadas para la primera version:

- `@fastify/swagger` y `@fastify/swagger-ui` para documentacion.
- `@fastify/cors` para controlar consumo desde apps externas.
- `@fastify/helmet` para headers de seguridad basicos.
- `@fastify/rate-limit` para proteger endpoints publicos.
- `pino` como logger, integrado con Fastify.
- `tsx` para ejecucion local en desarrollo.
- `tsup` para build simple de TypeScript.
- `dotenv` o carga de entorno equivalente para desarrollo local.

Opcionales para fases posteriores:

- Redis o Upstash para cache distribuido y rate limiting persistente.
- Sentry o equivalente para error tracking.
- OpenTelemetry para trazas si el trafico o scraping futuro lo justifica.
- GitHub Actions para CI.
- Supabase MCP o Supabase CLI para flujos controlados de base de datos.

### 2.1 Skills/Agents sugeridos

Para acelerar el desarrollo y revisar decisiones, conviene apoyarse en agentes o skills especializados:

- Arquitectura API: diseno de recursos REST, versionado, contratos y consistencia de responses.
- Backend TypeScript/Fastify: estructura modular, plugins, errores globales, validacion y testing.
- Database/Prisma/Supabase: modelado relacional, migraciones, indices, conexiones y limites del pool.
- Seguridad: rate limiting, headers, manejo de URLs externas, validacion estricta y secretos.
- DevOps/Deployment: Render, variables de entorno, health checks, build/start scripts y CI.
- QA/Testing: Vitest, pruebas de parser, rutas, validaciones y normalizacion.
- Documentacion OpenAPI: ejemplos claros, schemas, codigos de error y diferencias entre `makerWorldId` y `profileId`.
- Scraping compliance: revision de estrategia conservadora, TOS, backoff, timeouts y limites.

## 3. Variables de entorno

Estructura planeada para `.env.example`:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Server
PORT=3000
NODE_ENV=development
API_VERSION=0.1.0

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=1 minute
```

Notas:

- `DATABASE_URL` sera usada por la API en runtime.
- `DIRECT_URL` debe configurarse correctamente para Prisma/Supabase cuando las migraciones necesitan una conexion directa sin pooler.
- `.env.example` debe incluir `DIRECT_URL`, pero nunca debe contener secretos reales.
- No se deben commitear secretos reales.
- Si en el futuro se agregan jobs de scraping, sus limites, timeouts y feature flags deben vivir tambien en variables de entorno.

## 4. Contrato de API y versionado

Las rutas publicas de la API deben versionarse bajo `/api/v1`.

Rutas MVP versionadas:

- `GET /api/v1/models/resolve?url=`
- `GET /api/v1/models/:makerWorldId`
- `GET /api/v1/models/search?q=&page=&limit=`

`GET /health` puede mantenerse sin version para health checks de infraestructura, balanceadores y plataformas de deploy. Si se desea consistencia adicional, tambien se puede exponer un alias futuro como `GET /api/v1/health`, pero el MVP solo requiere `/health`.

Orden de registro de rutas:

- Registrar rutas especificas antes que rutas dinamicas.
- `GET /api/v1/models/resolve` debe registrarse antes que `GET /api/v1/models/:makerWorldId`.
- `GET /api/v1/models/search` debe registrarse antes que `GET /api/v1/models/:makerWorldId`.
- Esto evita que Fastify interprete `resolve` o `search` como valores de `makerWorldId`.

### Response contract

Todas las respuestas publicas deben usar un contrato consistente:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "metadata": {}
}
```

Respuesta exitosa:

- `success`: `true`.
- `data`: payload principal de la respuesta.
- `error`: `null`.
- `metadata`: datos auxiliares como version de API, paginacion, timestamp o informacion de resolve.

Respuesta de error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "MODEL_NOT_INDEXED",
    "message": "This MakerWorld model has not been indexed yet.",
    "details": null
  },
  "metadata": {
    "apiVersion": "v1"
  }
}
```

Campos de error:

- `code`: identificador estable para clientes.
- `message`: descripcion legible.
- `details`: informacion adicional opcional, sin filtrar secretos ni trazas internas.

Para endpoints paginados, `metadata` debe incluir:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
```

## 5. Propuesta de estructura de carpetas

```text
makerindex-api/
  src/
    app.ts
    server.ts
    config/
      env.ts
    routes/
      index.ts
    modules/
      health/
        health.route.ts
        health.schema.ts
      models/
        models.route.ts
        models.schema.ts
        models.service.ts
        models.mapper.ts
      scraper/
        scraper.service.ts
        scraper.types.ts
      creators/
        creators.service.ts
        creators.mapper.ts
      profiles/
        profiles.service.ts
        profiles.mapper.ts
    services/
      quality-scoring.service.ts
    utils/
      parse-makerworld-url.ts
      detect-input-type.ts
    lib/
      prisma.ts
      logger.ts
  prisma/
    schema.prisma
    migrations/
  tests/
    unit/
    integration/
```

Principios de estructura:

- `app.ts` construye la instancia Fastify y registra plugins/rutas.
- `server.ts` solo arranca el servidor y maneja senales del proceso.
- `modules/` agrupa comportamiento por dominio.
- `services/` contiene servicios compartidos entre modulos.
- `utils/` contiene funciones puras como parsers.
- `lib/` contiene clientes e integraciones compartidas como Prisma y logger.

## 6. Fases de desarrollo

### Fase 1: Setup del proyecto

- Inicializar proyecto Node.js con pnpm.
- Configurar TypeScript.
- Instalar dependencias base: Fastify, Prisma, Zod, Swagger, Vitest y tooling.
- Configurar scripts de `pnpm`:
  - `dev`
  - `build`
  - `start`
  - `test`
  - `test:watch`
  - `lint`
  - `format`
  - `prisma:generate`
  - `prisma:migrate`
- Configurar `tsconfig.json`.
- Agregar ESLint/Prettier si aplica.
- Agregar `.env.example`.
- Confirmar que no se agrega implementacion de scraping en esta fase.

### Fase 2: Servidor base con Fastify

- Crear `src/app.ts` para construir la app.
- Crear `src/server.ts` para iniciar el servidor.
- Agregar `GET /health`.
- Crear prefijo publico `/api/v1` para rutas versionadas.
- Agregar global error handler con responses consistentes.
- Agregar not found handler.
- Agregar loader basico de configuracion desde variables de entorno.
- Agregar logger base con Pino/Fastify.

`GET /health` debe regresar:

```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2026-05-10T00:00:00.000Z",
  "version": "0.1.0"
}
```

### Fase 3: Capa de utilidades

- Agregar `parseMakerWorldUrl`.
- Agregar `detectInputType` si la API necesitara distinguir URL, ID numerico u otro input.
- Extraer `makerWorldId` desde rutas tipo `/models/:id`.
- Extraer `profileId` desde hashes tipo `#profileId-:id`.
- Validar que solo se acepten URLs de MakerWorld para `resolve`.
- Agregar unit tests de parsing.

Ejemplo:

```text
https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip#profileId-468516
```

Resultado esperado:

```json
{
  "makerWorldId": 550165,
  "profileId": 468516
}
```

### Fase 4: Prisma + Supabase

- Agregar `prisma/schema.prisma`.
- Configurar `datasource db` con `DATABASE_URL` y `DIRECT_URL` para Prisma/Supabase cuando aplique.
- Agregar modelos:
  - `MakerModel`
  - `PrintProfile`
  - `Creator`
  - `Tag`
  - `ModelTag` o tabla pivote equivalente.
- Agregar migraciones cuando el schema este listo.
- Agregar singleton de Prisma Client en `src/lib/prisma.ts`.
- Documentar setup con Supabase.
- Revisar indices para busquedas por `makerWorldId`, `sourceProfileId`, titulo, creador y tags.

Notas Supabase:

- Usar `DATABASE_URL` para runtime.
- Usar `DIRECT_URL` para migraciones Prisma cuando Supabase use pooler o cuando Prisma requiera conexion directa.
- Confirmar que `.env.example` documenta `DATABASE_URL` y `DIRECT_URL` sin secretos reales.
- No exponer `service_role` ni secretos en clientes publicos.
- Aunque el MVP no tenga auth de usuario, conviene considerar RLS o esquemas privados si las tablas se exponen por la Data API de Supabase.
- Verificar comandos actuales de Supabase CLI antes de usarlos, porque la CLI cambia con frecuencia.

Modelo conceptual:

```text
Creator 1 - N MakerModel
MakerModel 1 - N PrintProfile
MakerModel N - N Tag via ModelTag
```

Campos planeados:

`MakerModel`:

- `id`
- `source`: `"makerworld"`
- `makerWorldId`
- `internalModelId` nullable
- `title`
- `slug` nullable
- `url`
- `thumbnailUrl` nullable
- `description` nullable
- `license` nullable
- `category` nullable
- `creatorId` nullable
- `downloadCount`
- `likeCount`
- `commentCount`
- `boostCount`
- `qualityScore`
- `indexStatus`: `candidate | indexed | low_quality | discarded`
- `skipReason` nullable
- `createdAt`
- `updatedAt`
- `firstScrapedAt`
- `lastScrapedAt`

`PrintProfile`:

- `id`
- `source`: `"makerworld"`
- `sourceProfileId`
- `modelId`
- `title` nullable
- `url` nullable
- `printerCompatibility` JSON nullable
- `material` nullable
- `layerHeightMm` nullable
- `walls` nullable
- `infillPercent` nullable
- `printTimeMinutes` nullable
- `filamentGrams` nullable
- `isEstimate`
- `createdAt`
- `updatedAt`
- `scrapedAt`

`Creator`:

- `id`
- `source`: `"makerworld"`
- `username` nullable
- `displayName` nullable
- `profileUrl` nullable
- `avatarUrl` nullable
- `fanCount` nullable
- `followCount` nullable
- `level` nullable
- `createdAt`
- `updatedAt`
- `scrapedAt`

`Tag`:

- `id`
- `source`: `"makerworld"` si los tags dependen de fuente externa
- `name`
- `slug`
- `createdAt`
- `updatedAt`

Importante: `printTimeMinutes` y `filamentGrams` pertenecen a `PrintProfile`, no a `MakerModel`.

El campo `source` queda fijado inicialmente como `"makerworld"` para abrir la puerta a fuentes futuras sin implementar multi-source todavia. En el MVP no debe haber logica de agregacion entre fuentes.

### Fase 5: Seed data para desarrollo

- Agregar seed data minima antes de implementar endpoints de modelos.
- Crear al menos un `Creator`, un `MakerModel`, dos `PrintProfile` y varios `Tag`.
- Incluir un caso con `profileId` para probar `resolve`.
- Incluir un caso sin `profileId` seleccionado para probar respuesta de modelo completo.
- Usar datos ficticios o claramente derivados de ejemplos, sin descargar assets ni archivos.
- Guardar solo URLs de ejemplo para thumbnails.
- Asegurar que seed data permita probar search sin scraping real.

### Fase 6: Modulo de modelos sin scraping

- Implementar `GET /api/v1/models/:makerWorldId` usando solo la base de datos local.
- Implementar `GET /api/v1/models/search?q=&page=&limit=` usando solo la base de datos local.
- Agregar DTOs/responses normalizados.
- Agregar validacion con Zod.
- Agregar paginacion desde el MVP con `page` y `limit`.
- No hacer llamadas en vivo a MakerWorld desde search.
- Devolver errores claros cuando un modelo no exista o no este indexado.
- Registrar `resolve` y `search` antes de `:makerWorldId`.

Parametros obligatorios de search en MVP:

- `q`: texto a buscar por titulo, tags o creador.
- `page`: pagina solicitada, empezando en `1`.
- `limit`: cantidad de resultados por pagina.

Filtros futuros para search:

- `category`
- `tag`
- `creator`
- `minDownloads`
- `minLikes`
- `hasPrintProfiles`
- `material`
- `printerCompatibility`
- `indexStatus`
- `sort`

En el MVP solo son obligatorios `q`, `page` y `limit`. Los filtros futuros deben documentarse como planificados, pero no bloquear la primera version.

Response normalizada esperada para modelo:

```json
{
  "success": true,
  "data": {
    "source": "makerworld",
    "makerWorldId": 550165,
    "title": "Utility Carabiner",
    "url": "https://makerworld.com/en/models/550165-utility-carabiner-secure-versatile-everyday-clip",
    "thumbnailUrl": "https://...",
    "creator": {
      "username": "creator",
      "displayName": "Creator"
    },
    "stats": {
      "downloads": 10,
      "likes": 4,
      "comments": 1,
      "boosts": 0
    },
    "tags": ["utility", "clip"],
    "category": "Tools",
    "printProfiles": []
  },
  "error": null,
  "metadata": {
    "apiVersion": "v1"
  }
}
```

### Fase 7: Endpoint resolve

- Implementar `GET /api/v1/models/resolve?url=`.
- Validar `url` con Zod.
- Parsear URL de MakerWorld.
- Regresar `makerWorldId` y `profileId` cuando exista.
- Buscar el modelo en DB usando `makerWorldId`.
- Si `profileId` esta presente, buscar `selectedProfile` dentro de los print profiles del modelo.
- Si el modelo no esta indexado, regresar 404 claro.
- No activar scraping en el MVP salvo que se pida explicitamente en una fase posterior.

Response cuando existe:

```json
{
  "success": true,
  "data": {
    "makerWorldId": 550165,
    "profileId": 468516,
    "indexed": true,
    "model": {},
    "selectedProfile": {}
  },
  "error": null,
  "metadata": {
    "apiVersion": "v1"
  }
}
```

Response cuando no existe:

```json
{
  "success": false,
  "data": {
    "makerWorldId": 550165,
    "profileId": 468516,
    "indexed": false
  },
  "error": {
    "code": "MODEL_NOT_INDEXED",
    "message": "This MakerWorld model has not been indexed yet.",
    "details": null
  },
  "metadata": {
    "apiVersion": "v1"
  }
}
```

### Fase 8: Swagger/OpenAPI

- Agregar Swagger UI.
- Documentar todos los endpoints MVP.
- Agregar ejemplos de request/response.
- Documentar codigos de error.
- Documentar contrato estandar `success`, `data`, `error`, `metadata`.
- Explicar diferencia entre:
  - `makerWorldId`: ID numerico del modelo en la URL.
  - `profileId`: ID del print profile en el hash `#profileId-:id`.
- Documentar que search no hace scraping en vivo.
- Documentar paginacion de search con `page` y `limit`.
- Documentar que la API no almacena ni redistribuye STL/3MF.

### Fase 9: Testing

- Agregar tests con Vitest.
- Testear `parseMakerWorldUrl`.
- Testear extraccion de `makerWorldId` desde `/models/:id`.
- Testear extraccion opcional de `profileId` desde `#profileId-:id`.
- Testear `/health`.
- Testear validaciones Zod.
- Testear normalizacion de response de modelos.
- Testear contrato de respuesta `success`, `data`, `error`, `metadata`.
- Testear paginacion de search con `page` y `limit`.
- Testear que `/api/v1/models/search` usa DB local y no invoca scraper.
- Testear que rutas especificas `resolve` y `search` no colisionan con `:makerWorldId`.
- Preparar integration tests ligeros con app Fastify inyectada, sin abrir puerto real.

### Fase 10: Base conservadora para scraper

Esta fase solo prepara arquitectura. No debe implementar scraping real de produccion sin una decision posterior.

- Agregar dependencia Playwright cuando llegue la fase.
- Crear interfaz/base de `scraper.service.ts`.
- Definir metodos futuros como:
  - `fetchModelMetadataByUrl(url)`
  - `fetchModelMetadataById(makerWorldId)`
- No depender todavia de selectores fragiles.
- Disenar timeouts estrictos.
- Disenar retries limitados con backoff.
- Agregar rate conservador.
- Evitar crawling amplio.
- Permitir scraping puntual por URL o `makerWorldId`, nunca por cada busqueda.
- Registrar `lastScrapedAt`, `firstScrapedAt`, `skipReason` e `indexStatus`.

Principios:

- Respetar robots/TOS y limites razonables.
- No descargar archivos de modelos.
- No almacenar imagenes.
- No intentar indexar todo MakerWorld.

### Fase 11: Quality scoring

- Agregar servicio de quality scoring.
- Calcular score con base en metadata disponible y engagement publico.
- Usar estados:
  - `candidate`
  - `indexed`
  - `low_quality`
  - `discarded`
- No guardar o promover todos los modelos automaticamente.
- Documentar por que modelos con engagement cero pueden degradarse o descartarse.

Reglas iniciales para marcar `indexed`:

- `downloads >= 5`
- O `likes >= 2`
- O `comments >= 1`
- O `boosts >= 1`
- O modelo nuevo con metadata basica y al menos una senal de actividad.

Reglas para `low_quality` o `discarded`:

- Falta `title`.
- Falta `thumbnailUrl`.
- Modelo viejo con engagement cero.
- No tiene categoria ni metadata util.
- Engagement score demasiado bajo despues del periodo `candidate`.

### Fase 12: Rate limiting y cache

- Agregar `@fastify/rate-limit`.
- Usar limites globales razonables.
- Usar limites mas estrictos para endpoints que en el futuro puedan activar scraping.
- Mantener `/health` barato y estable.
- Considerar Redis/Upstash despues si:
  - Hay multiples instancias.
  - Se necesita rate limiting distribuido.
  - Se agregan caches de responses.
  - Se activan trabajos de scraping on-demand.

Politica inicial:

- `GET /api/v1/models/search` debe consultar DB local y puede cachearse.
- `GET /api/v1/models/:makerWorldId` puede cachearse por periodos cortos.
- `GET /api/v1/models/resolve` puede tener limite mas estricto por aceptar URLs externas.

### Fase 13: Deployment

Objetivo inicial: Render.

- Configurar build command: `pnpm install --frozen-lockfile && pnpm build`.
- Configurar start command: `pnpm start`.
- Definir `PORT` desde Render.
- Configurar variables de entorno de produccion.
- Conectar con Supabase usando `DATABASE_URL`.
- Usar `DIRECT_URL` solo donde aplique para migraciones.
- Configurar health check con `GET /health`.
- Ejecutar migraciones de forma controlada, no automaticamente sin revision.
- Agregar CI mas adelante para correr `pnpm test` y `pnpm build`.

## 7. Criterios de aceptacion del MVP

El MVP se considera completo cuando:

- El servidor corre localmente con pnpm.
- `GET /health` funciona y devuelve `status`, `uptime`, `timestamp` y `version`.
- Las rutas publicas de modelos viven bajo `/api/v1`.
- Las rutas `resolve` y `search` se registran antes de `:makerWorldId`.
- Las respuestas usan el contrato `success`, `data`, `error`, `metadata`.
- Prisma conecta correctamente con Supabase Postgres.
- `DIRECT_URL` esta documentado en `.env.example` para migraciones Prisma/Supabase sin secretos reales.
- El parser de URL extrae `makerWorldId` correctamente.
- El parser extrae `profileId` cuando existe.
- Existe seed data suficiente para probar modelos, profiles, creators y tags sin scraping.
- `GET /api/v1/models/resolve?url=` parsea URLs de MakerWorld.
- `GET /api/v1/models/resolve?url=` busca el modelo en DB y responde claramente si no esta indexado.
- `GET /api/v1/models/:makerWorldId` lee desde DB.
- `GET /api/v1/models/search?q=&page=&limit=` busca en DB por titulo, tags y creador.
- Search implementa paginacion desde el MVP.
- No hay scraping en vivo para search.
- Existe documentacion Swagger/OpenAPI para los endpoints MVP.
- Tests basicos de Vitest pasan.
- No se almacenan STL/3MF.
- No se almacenan imagenes, solo URLs.

## 8. Riesgos y decisiones

Riesgos:

- Scraping puede estar limitado por terminos de uso, cambios de MakerWorld o protecciones anti-bot.
- HTML y estructura frontend de MakerWorld pueden cambiar sin aviso.
- Selectores fragiles pueden romper el scraper futuro.
- Free tier de Supabase puede limitar conexiones, almacenamiento o performance.
- Busquedas amplias sin indices pueden degradar performance.
- URLs externas pueden introducir inputs malformados si no se validan estrictamente.
- Indexar modelos basura con engagement cero reduce calidad de la API.

Decisiones:

- No almacenar, redistribuir, descargar ni espejear archivos STL/3MF.
- No almacenar imagenes, solo URLs.
- No construir autenticacion de usuarios en el MVP.
- No construir billing.
- No hacer scraping agresivo.
- No hacer scraping por cada search.
- No intentar indexar todo MakerWorld.
- Mantener `makerWorldId` y `profileId` como conceptos separados.
- Mantener estimaciones de tiempo y filamento en `PrintProfile`.
- Mantener `source = "makerworld"` en modelos principales para expansion futura, sin implementar multi-source en el MVP.
- Usar `printerCompatibility` como JSON nullable en el MVP para evitar sobre-modelar compatibilidades antes de conocer formatos reales.
- Usar `/api/v1` para rutas publicas y conservar `/health` sin version para infraestructura.
- Implementar seed data antes de endpoints de modelos para probar sin scraping real.
- Priorizar metadata normalizada, documentacion clara y tests basicos antes de scraping.
- Tratar scraping futuro como una capacidad conservadora, puntual y rate-limited.

## 9. Siguientes pasos inmediatos

Checklist exacto de primera implementacion:

- Instalar dependencias.
- Crear base Fastify.
- Agregar `GET /health`.
- Agregar utilidad `parseMakerWorldUrl`.
- Agregar tests para parser y health route.
- Configurar Prisma.
- Crear schema inicial.
- Crear primera migracion.
- Agregar seed data minima.
- Configurar Swagger/OpenAPI.
- Implementar endpoints de modelos usando solo DB.
