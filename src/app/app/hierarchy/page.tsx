import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

interface Node {
  name: string;
  role: string;
  tag: 'core' | 'external' | 'reservist' | 'partner' | 'candidate';
  children?: Node[];
}

const tree: Node = {
  name: 'Allan Chan',
  role: 'CEO & Interim CFO',
  tag: 'core',
  children: [
    {
      name: '__SECTION__',
      role: 'Sales Division',
      tag: 'core',
      children: [
        {
          name: 'Lachlan Macdonald',
          role: 'Sales Owner (CCO, Buenos Aires + AUS coverage)',
          tag: 'core',
          children: [
            {
              name: 'Hazem Dweik',
              role: 'Head of People / Sales Manager',
              tag: 'core',
              children: [
                { name: 'Bisho', role: 'Sales', tag: 'external' },
                { name: 'Tomoki', role: 'Sales', tag: 'external' },
                { name: 'Hamzah', role: 'Sales', tag: 'external' },
                { name: 'Aziz', role: 'Sales', tag: 'external' },
              ],
            },
            {
              name: 'Thomas Charrier',
              role: 'Sales Manager (CST, Missouri)',
              tag: 'core',
              children: [
                { name: 'Nathan', role: 'Partner / Core Sales (CST, Missouri)', tag: 'partner' },
              ],
            },
            {
              name: 'Zuriel Robledo',
              role: 'Sales Manager (CST, Texas)',
              tag: 'core',
              children: [{ name: 'Leo Ioannidis', role: 'Candidate', tag: 'candidate' }],
            },
            { name: 'Lewis Hayward', role: 'RSM (GMT, UK)', tag: 'core' },
            { name: 'James Taylor', role: 'Sales & Marketing (Ireland)', tag: 'core' },
            {
              name: 'Allan Chan',
              role: 'Field Sales Onboarding',
              tag: 'core',
              children: [
                { name: 'Cory McGuckin', role: 'Field Sales Agent', tag: 'external' },
                { name: 'Gerrard McFerran', role: 'Field Sales Agent', tag: 'external' },
                { name: 'ETKC', role: 'Field Sales Agent', tag: 'external' },
                { name: 'Yonalle', role: 'Field Sales Agent', tag: 'external' },
                { name: 'Nicky', role: 'Field Sales Agent', tag: 'external' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: '__SECTION__',
      role: 'Marketing Division',
      tag: 'core',
      children: [
        {
          name: 'Bailey Barry',
          role: 'Marketing Lead / front-line ownership',
          tag: 'core',
          children: [
            {
              name: 'Hazem Dweik',
              role: 'Marketing Owner / final approval',
              tag: 'core',
              children: [
                { name: "Barry's Brother", role: 'Reservist', tag: 'reservist' },
                { name: 'Valdas', role: 'Reservist', tag: 'reservist' },
                { name: 'Kelvin', role: 'Reservist', tag: 'reservist' },
                { name: 'James (Reservist)', role: 'Reservist', tag: 'reservist' },
              ],
            },
            { name: 'Emil Larsen', role: 'Interim COO / Video & Creative Fulfilment (GMT+1, Denmark)', tag: 'core' },
            { name: 'Julian van Dijk', role: 'Head of Affiliate Marketing / Social Media (GMT+1, Netherlands)', tag: 'core' },
            { name: 'James Taylor', role: 'Sales & Marketing (Ireland)', tag: 'core' },
            { name: 'Arián Hidalgo', role: 'Marketing External', tag: 'external' },
          ],
        },
      ],
    },
    {
      name: '__SECTION__',
      role: 'Technology Division',
      tag: 'core',
      children: [
        {
          name: 'Arnis Piekus',
          role: 'CTO / Technology Owner (Buenos Aires)',
          tag: 'core',
          children: [
            { name: 'Bailey Barry', role: 'AI & Technical Fulfilment Lead', tag: 'core' },
            { name: 'Jeison Mulder', role: 'VP of Products (GMT+1, Netherlands)', tag: 'core' },
            { name: 'Tanzeel Ahmad', role: 'VP of Products (GMT+12, Australia)', tag: 'core' },
            { name: 'Chase Buchanan', role: 'VP of Products (GMT−7, California)', tag: 'core' },
            { name: 'Callum McFarlen', role: 'VP of Products (UTC, England)', tag: 'core' },
            { name: 'Emil Larsen', role: 'Backend & Coding Support', tag: 'core' },
          ],
        },
      ],
    },
    {
      name: '__SECTION__',
      role: 'E-commerce Division',
      tag: 'core',
      children: [
        {
          name: 'Hazem Dweik',
          role: 'E-commerce Manager',
          tag: 'core',
          children: [
            {
              name: 'Julian van Dijk',
              role: 'Head of Affiliate / E-commerce Operator',
              tag: 'core',
              children: [
                { name: 'Ross', role: 'Affiliate', tag: 'external' },
                { name: 'Matt', role: 'Affiliate', tag: 'external' },
                { name: 'Mantas', role: 'Affiliate', tag: 'external' },
                { name: 'Bisho', role: 'Affiliate', tag: 'external' },
                { name: 'Tomoki', role: 'Affiliate', tag: 'external' },
              ],
            },
            { name: 'Bailey Barry', role: 'Store Setup & Technical/Marketing', tag: 'core' },
            { name: 'Emil Larsen', role: 'Store Videos, Content & Backend', tag: 'core' },
          ],
        },
      ],
    },
    {
      name: '__SECTION__',
      role: 'People / Internal Health',
      tag: 'core',
      children: [
        {
          name: 'Hazem Dweik',
          role: 'Head of People (GMT+1, Czech Republic) - role clarity, morale, private check-ins, conflict handling',
          tag: 'core',
        },
      ],
    },
    {
      name: '__SECTION__',
      role: 'Partner / Other',
      tag: 'core',
      children: [{ name: 'Ratan', role: 'Fulfilment candidate (and his team)', tag: 'candidate' }],
    },
  ],
};

const dotColor: Record<Node['tag'], string> = {
  core: '#2563eb',
  external: '#dc2626',
  reservist: '#f59e0b',
  partner: '#16a34a',
  candidate: '#7c3aed',
};

const tagLabel: Record<Node['tag'], string> = {
  core: 'Core team',
  external: 'External',
  reservist: 'Reservist',
  partner: 'Partner',
  candidate: 'Candidate',
};

function Dot({ tag }: { tag: Node['tag'] }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: dotColor[tag] }}
    />
  );
}

/** Renders people under an owner, with subtle reporting lines for nesting. */
function TreeList({ nodes, depth = 0 }: { nodes: Node[]; depth?: number }) {
  return (
    <ul
      className={
        depth === 0
          ? 'm-0 list-none space-y-1.5 p-0'
          : 'm-0 mt-1.5 list-none space-y-1.5 border-l border-[var(--color-border)] pl-3.5'
      }
    >
      {nodes.map((node, i) => (
        <li key={i}>
          <div className="flex items-baseline gap-2">
            <span className="translate-y-[3px]">
              <Dot tag={node.tag} />
            </span>
            <span className="text-[13px] leading-snug">
              <span className="font-semibold text-[var(--color-fg)]">{node.name}</span>
              <span className="text-[var(--color-fg-muted)]"> — {node.role}</span>
            </span>
          </div>
          {node.children?.length ? <TreeList nodes={node.children} depth={depth + 1} /> : null}
        </li>
      ))}
    </ul>
  );
}

export default function HierarchyPage() {
  const divisions = (tree.children ?? []).filter((node) => node.name === '__SECTION__');

  return (
    <div>
      <PageHeader
        title="Company hierarchy"
        description="Allan is CEO. Under him sit the division owners, and under each owner are the people in that lane."
      />

      <div className="space-y-4 p-7">
        <Card className="flex items-center gap-3 p-5">
          <Dot tag="core" />
          <div>
            <div className="text-[15px] font-semibold text-[var(--color-fg)]">{tree.name}</div>
            <div className="text-[12px] text-[var(--color-fg-muted)]">{tree.role}</div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {(Object.keys(tagLabel) as Node['tag'][]).map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-fg-muted)]">
              <Dot tag={tag} /> {tagLabel[tag]}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {divisions.map((division, i) => (
            <Card key={i} className="p-5">
              <h2 className="mb-3 text-[14px] font-semibold text-[var(--color-fg)]">{division.role}</h2>
              {division.children?.length ? <TreeList nodes={division.children} /> : (
                <p className="text-[12px] text-[var(--color-fg-dim)]">No one assigned yet.</p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
