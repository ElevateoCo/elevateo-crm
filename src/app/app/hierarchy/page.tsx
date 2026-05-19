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
          name: 'Roy Neven',
          role: 'Sales Owner (RSM, Netherlands)',
          tag: 'core',
          children: [
            {
              name: 'Hazem Dw.',
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
              name: 'Zuri Robledo',
              role: 'Sales Manager (CST, Texas)',
              tag: 'core',
              children: [{ name: 'Leo Ioannidis', role: 'Candidate', tag: 'candidate' }],
            },
            { name: 'Lachie', role: 'CCO / RSM (Buenos Aires + AUS coverage)', tag: 'core' },
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
          name: 'Hazem Dw.',
          role: 'Marketing Owner / final approval',
          tag: 'core',
          children: [
            {
              name: 'Bailey',
              role: 'CMO / Rosey Co Squad Leader',
              tag: 'core',
              children: [
                { name: "Barry's Brother", role: 'Reservist', tag: 'reservist' },
                { name: 'Valdas', role: 'Reservist', tag: 'reservist' },
                { name: 'Kelvin', role: 'Reservist', tag: 'reservist' },
                { name: 'James', role: 'Reservist', tag: 'reservist' },
              ],
            },
            { name: 'Emil Larsen', role: 'Interim COO / Video & Creative Fulfilment (GMT+1, Denmark)', tag: 'core' },
            { name: 'Julian', role: 'Head of Affiliate Marketing / Social Media (GMT+1, Netherlands)', tag: 'core' },
            { name: 'James Taylor', role: 'Sales & Marketing (Ireland)', tag: 'core' },
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
          name: 'Arnis',
          role: 'CTO / Technology Owner (Buenos Aires)',
          tag: 'core',
          children: [
            { name: 'Bailey', role: 'AI & Technical Fulfilment Lead', tag: 'core' },
            { name: 'Jeison', role: 'VP of Products (GMT+1, Netherlands)', tag: 'core' },
            { name: 'Tanzeel Ahmad', role: 'VP of Products (GMT+12, Australia)', tag: 'core' },
            { name: 'Chase Buchanan', role: 'VP of Products (GMT−7, California)', tag: 'core' },
            { name: 'Callum', role: 'VP of Products (UTC, England)', tag: 'core' },
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
          name: 'Hazem Dw.',
          role: 'E-commerce Manager',
          tag: 'core',
          children: [
            {
              name: 'Julian',
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
            { name: 'Bailey', role: 'Store Setup & Technical/Marketing', tag: 'core' },
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
          name: 'Hazem Dw.',
          role: 'Head of People (GMT+1, Czech Republic) - role clarity, morale, private check-ins, conflict handling',
          tag: 'core',
        },
      ],
    },
    {
      name: '__SECTION__',
      role: 'Partner / Other',
      tag: 'core',
      children: [{ name: 'Ratan and his team', role: 'Fulfilment candidate', tag: 'candidate' }],
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

function TreeList({ nodes }: { nodes: Node[] }) {
  return (
    <ul className="m-0 pl-3.5 ml-6 border-l border-[#dddddd]">
      {nodes.map((node, i) => (
        <li key={i} className="my-1.5 pl-2">
          {node.name === '__SECTION__' ? (
            <div className="mt-3">
              <span className="inline-block bg-[#f1f1f1] border border-[#dddddd] rounded-full px-2.5 py-[3px] text-[13px] uppercase tracking-wide text-[#333]">
                {node.role}
              </span>
              {node.children?.length ? <TreeList nodes={node.children} /> : null}
            </div>
          ) : (
            <>
              <span
                className="inline-block w-[9px] h-[9px] rounded-full mr-[7px] align-[1px]"
                style={{ background: dotColor[node.tag] }}
              />
              <strong className="font-bold text-black">{node.name}</strong>
              <span className="text-[#151515]"> - {node.role}</span>
              {node.children?.length ? <TreeList nodes={node.children} /> : null}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function HierarchyPage() {
  return (
    <div>
      <PageHeader
        title="Company hierarchy"
        description="Simple linear hierarchy. Allan is CEO. Under him are the division owners. Under each division owner are the people in that lane."
      />

      <div className="p-7">
        <Card className="p-6 bg-white">
          <p className="m-0 mb-[18px] text-[#555555] text-[14px]">
            <span className="mr-[18px] whitespace-nowrap">
              <span
                className="inline-block w-[9px] h-[9px] rounded-full mr-[7px] align-[1px]"
                style={{ background: dotColor.core }}
              />
              Core team
            </span>
            <span className="mr-[18px] whitespace-nowrap">
              <span
                className="inline-block w-[9px] h-[9px] rounded-full mr-[7px] align-[1px]"
                style={{ background: dotColor.external }}
              />
              External
            </span>
            <span className="mr-[18px] whitespace-nowrap">
              <span
                className="inline-block w-[9px] h-[9px] rounded-full mr-[7px] align-[1px]"
                style={{ background: dotColor.reservist }}
              />
              Reservist
            </span>
            <span className="mr-[18px] whitespace-nowrap">
              <span
                className="inline-block w-[9px] h-[9px] rounded-full mr-[7px] align-[1px]"
                style={{ background: dotColor.partner }}
              />
              Partner
            </span>
            <span className="mr-[18px] whitespace-nowrap">
              <span
                className="inline-block w-[9px] h-[9px] rounded-full mr-[7px] align-[1px]"
                style={{ background: dotColor.candidate }}
              />
              Candidate
            </span>
          </p>

          <div
            className="border border-[#d8d8d8] rounded-lg p-[22px] bg-white shadow-[0_8px_22px_rgba(0,0,0,0.06)] text-[15px] leading-[1.5] text-[#151515]"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            <ul className="m-0 p-0 list-none">
              <li className="my-1.5">
                <span
                  className="inline-block w-[9px] h-[9px] rounded-full mr-[7px] align-[1px]"
                  style={{ background: dotColor.core }}
                />
                <strong className="font-bold text-black">{tree.name}</strong> - {tree.role}
                {tree.children?.length ? <TreeList nodes={tree.children} /> : null}
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
