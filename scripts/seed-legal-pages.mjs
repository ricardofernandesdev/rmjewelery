/**
 * One-off script: insert (or update) the Privacy Policy and Terms of Use
 * pages in the `pages` table.
 *
 * Usage:
 *   DB_URL='postgresql://...' node scripts/seed-legal-pages.mjs
 *
 * After running, the pages are live at:
 *   /privacidade
 *   /termos
 *
 * They can be edited in the admin at /admin/collections/pages.
 */
import pg from 'pg'

const DB = process.env.DB_URL || process.env.DATABASE_URI
if (!DB) {
  console.error('Missing DB_URL or DATABASE_URI')
  process.exit(1)
}

// ── Lexical helpers ────────────────────────────────────────────────────
const text = (t, format = 0) => ({ type: 'text', text: t, format, version: 1 })
const para = (children) => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children,
})
const heading = (tag, t) => ({
  type: 'heading',
  tag,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [text(t)],
})
const listItem = (children) => ({
  type: 'listitem',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  value: 1,
  children,
})
const list = (items) => ({
  type: 'list',
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: items.map((children) => listItem(children)),
})
const root = (children) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children,
  },
})

// ── Privacy Policy ─────────────────────────────────────────────────────
const privacyContent = root([
  para([text('Última atualização: 16 de Abril de 2026.')]),
  para([
    text(
      'A R&M Jewelry ("nós") leva a sério a privacidade dos visitantes do site rmjewelrycollection.com. Esta política descreve que dados recolhemos, com que finalidade, durante quanto tempo e quais os teus direitos ao abrigo do Regulamento Geral sobre a Proteção de Dados (RGPD).',
    ),
  ]),

  heading('h2', '1. Quem é o responsável pelo tratamento'),
  para([
    text('R&M Jewelry — marca operada por Ricardo Fernandes, residente em Braga, Portugal. Contacto: '),
    text('contacto@rmjewelrycollection.com', 1),
    text('.'),
  ]),

  heading('h2', '2. Que dados recolhemos'),
  para([
    text(
      'Não temos área de cliente nem checkout no site. As compras concretizam-se através de mensagem direta no Instagram. Por isso, no site recolhemos apenas o estritamente necessário para o operar:',
    ),
  ]),
  list([
    [
      text('Dados de utilização agregados', 1),
      text(' (Vercel Analytics e Speed Insights): páginas visitadas, tempo na página, tipo de dispositivo, país aproximado. Estes dados são anónimos e não usam cookies.'),
    ],
    [
      text('Lista de favoritos', 1),
      text(' (wishlist): guardada exclusivamente no localStorage do teu próprio browser. Não é enviada para os nossos servidores.'),
    ],
    [
      text('Logs técnicos do servidor e da Cloudflare', 1),
      text(' (endereço IP, user agent, URL acedido): mantidos por 30 dias para deteção de abusos e diagnóstico de erros.'),
    ],
  ]),

  heading('h2', '3. Finalidades e base jurídica'),
  list([
    [text('Funcionamento do site (artigo 6.º, n.º 1, alínea f) — interesse legítimo).')],
    [text('Estatísticas agregadas para melhorar a experiência (interesse legítimo, dados anónimos).')],
    [text('Cumprimento de obrigações legais quando aplicável (alínea c).')],
  ]),

  heading('h2', '4. Subcontratantes'),
  para([
    text(
      'Os dados são processados pelos seguintes prestadores de serviços, todos eles com garantias contratuais de proteção de dados:',
    ),
  ]),
  list([
    [text('Vercel Inc. (alojamento e analytics) — Estados Unidos, com cláusulas contratuais-tipo da UE.')],
    [text('Cloudflare Inc. (DNS, CDN e armazenamento de imagens R2) — Estados Unidos, com cláusulas contratuais-tipo da UE.')],
    [text('Neon Inc. (base de dados PostgreSQL) — Frankfurt, Alemanha (UE).')],
  ]),

  heading('h2', '5. Redirects para o Instagram'),
  para([
    text(
      'Quando clicas em "Enviar mensagem no Instagram" ou em qualquer link para o nosso perfil, sais do nosso site e passas a interagir diretamente com a Meta (Instagram). A partir desse momento aplica-se a política de privacidade do Instagram, que podes consultar em ',
    ),
    text('https://privacycenter.instagram.com', 1),
    text('.'),
  ]),

  heading('h2', '6. Cookies'),
  para([
    text(
      'O site não usa cookies próprios para tracking. As ferramentas de analytics que utilizamos (Vercel Analytics e Speed Insights) são cookieless por design — não armazenam identificadores no teu browser e não permitem identificação individual.',
    ),
  ]),

  heading('h2', '7. Os teus direitos'),
  para([text('Tens direito a:')]),
  list([
    [text('Aceder aos dados pessoais que tenhamos sobre ti.')],
    [text('Pedir a sua retificação ou apagamento.')],
    [text('Opor-te ao tratamento ou pedir a sua limitação.')],
    [text('Apresentar reclamação à Comissão Nacional de Proteção de Dados (CNPD) em www.cnpd.pt.')],
  ]),
  para([
    text('Para exercer qualquer destes direitos, contacta-nos por email para '),
    text('contacto@rmjewelrycollection.com', 1),
    text('.'),
  ]),

  heading('h2', '8. Conservação dos dados'),
  para([
    text(
      'Os logs técnicos são conservados por 30 dias. Os dados agregados de analytics são conservados pelo período definido pelo prestador (Vercel Analytics: 12 meses). Não conservamos dados pessoais identificáveis no nosso site.',
    ),
  ]),

  heading('h2', '9. Alterações a esta política'),
  para([
    text(
      'Podemos atualizar esta política de tempos a tempos. A data da última alteração está sempre no topo. Alterações materiais são comunicadas no Instagram da R&M Jewelry.',
    ),
  ]),
])

// ── Terms of Use ───────────────────────────────────────────────────────
const termsContent = root([
  para([text('Última atualização: 16 de Abril de 2026.')]),
  para([
    text(
      'Estes Termos de Utilização regulam o acesso e a utilização do site rmjewelrycollection.com. Ao usar o site aceitas estas condições. Se não concordares com elas, por favor abandona o site.',
    ),
  ]),

  heading('h2', '1. Sobre nós'),
  para([
    text(
      'O site rmjewelrycollection.com é operado pela R&M Jewelry — marca de Ricardo Fernandes, residente em Braga, Portugal. Para qualquer questão jurídica ou comercial: ',
    ),
    text('contacto@rmjewelrycollection.com', 1),
    text('.'),
  ]),

  heading('h2', '2. Natureza do site'),
  para([
    text(
      'O site é um catálogo institucional. Não dispõe de carrinho de compras nem de checkout. As vendas concretizam-se exclusivamente através de mensagens diretas no Instagram (@rmjewelry.collection). Qualquer informação sobre preço ou disponibilidade no site tem caráter indicativo — o preço final, condições de envio, garantia e devolução são acordados na conversa direta com o cliente, antes do pagamento.',
    ),
  ]),

  heading('h2', '3. Propriedade intelectual'),
  para([
    text(
      'Todo o conteúdo do site (textos, fotografias dos produtos, design, código, marca R&M Jewelry) é propriedade da R&M Jewelry ou dos seus licenciadores e está protegido pelas leis de propriedade intelectual portuguesas e europeias. Não é permitido copiar, reproduzir, modificar ou redistribuir conteúdo sem autorização expressa e por escrito.',
    ),
  ]),

  heading('h2', '4. Utilização permitida'),
  para([text('Comprometes-te a usar o site apenas para fins legítimos. Em particular, é proibido:')]),
  list([
    [text('Tentar aceder a áreas restritas (por exemplo /admin) sem autorização.')],
    [text('Recolher dados em massa por meios automatizados (scraping) que excedam o uso normal.')],
    [text('Distribuir malware, fazer ataques de negação de serviço ou tentar comprometer a segurança do site.')],
    [text('Reproduzir as fotografias dos produtos para fins comerciais sem licença.')],
  ]),

  heading('h2', '5. Compras via Instagram'),
  para([
    text(
      'As vendas são acordos diretos entre o cliente e a R&M Jewelry, formalizados em conversa privada no Instagram. Aplica-se a legislação portuguesa de proteção do consumidor, nomeadamente o Decreto-Lei n.º 24/2014, que confere ao consumidor o direito de livre resolução em 14 dias após a receção do produto. Os detalhes específicos de cada compra (preço, prazo de envio, custos, política de devolução) são confirmados na conversa antes do pagamento.',
    ),
  ]),

  heading('h2', '6. Limitação de responsabilidade'),
  para([
    text(
      'Esforçamo-nos por manter a informação atualizada e o site disponível, mas não garantimos que o conteúdo esteja sempre 100% correto, completo ou disponível sem interrupções. A R&M Jewelry não é responsável por danos indiretos resultantes da utilização do site (por exemplo, decisões tomadas com base em informação aqui publicada). A nossa responsabilidade limita-se ao valor da compra concreta acordada com o cliente.',
    ),
  ]),

  heading('h2', '7. Links externos'),
  para([
    text(
      'O site contém links para serviços de terceiros (Instagram, WhatsApp). Não controlamos esses sites e não somos responsáveis pelo seu conteúdo nem pelas suas práticas de privacidade. Acede-os por tua conta e risco.',
    ),
  ]),

  heading('h2', '8. Privacidade'),
  para([
    text('A recolha e tratamento de dados pessoais está descrita em detalhe na nossa Política de Privacidade, disponível em '),
    text('/privacidade', 1),
    text('.'),
  ]),

  heading('h2', '9. Lei aplicável e foro'),
  para([
    text(
      'Estes Termos regem-se pela lei portuguesa. Qualquer litígio será resolvido nos tribunais de Braga, Portugal, sem prejuízo dos direitos do consumidor a recorrer a entidades de resolução alternativa de litígios (ver www.cniacc.pt).',
    ),
  ]),

  heading('h2', '10. Alterações aos termos'),
  para([
    text(
      'Reservamo-nos o direito de alterar estes Termos a qualquer momento. A versão em vigor é sempre a publicada nesta página, com a data de última atualização indicada no topo.',
    ),
  ]),
])

// ── Page records ───────────────────────────────────────────────────────
const pages = [
  {
    slug: 'privacidade',
    title: 'Política de Privacidade',
    content: privacyContent,
  },
  {
    slug: 'termos',
    title: 'Termos de Utilização',
    content: termsContent,
  },
]

// ── Insert / update ────────────────────────────────────────────────────
const c = new pg.Client({ connectionString: DB })
await c.connect()
let ok = 0,
  err = 0
for (const p of pages) {
  try {
    const existing = await c.query('SELECT id FROM pages WHERE slug = $1 LIMIT 1', [p.slug])
    if (existing.rows[0]) {
      await c.query(
        `UPDATE pages
         SET title = $1, content = $2, published = true, updated_at = NOW()
         WHERE slug = $3`,
        [p.title, JSON.stringify(p.content), p.slug],
      )
      console.log(`✓ updated  /${p.slug}  "${p.title}"`)
    } else {
      await c.query(
        `INSERT INTO pages (slug, title, content, published, created_at, updated_at)
         VALUES ($1, $2, $3, true, NOW(), NOW())`,
        [p.slug, p.title, JSON.stringify(p.content)],
      )
      console.log(`✓ inserted /${p.slug}  "${p.title}"`)
    }
    ok++
  } catch (e) {
    console.error(`✗ failed   /${p.slug}:`, e.message)
    err++
  }
}
console.log(`\nDone: ${ok} ok, ${err} errors.`)
await c.end()
