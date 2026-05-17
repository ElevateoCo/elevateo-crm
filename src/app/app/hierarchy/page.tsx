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
  role: 'CEO',
  tag: 'core',
  children: [
    {
      name: '__SECTION__',
      role: 'Sales Division',
      tag: 'core',
      children: [
        {
          name: 'Roy Neven',
          role: 'Sales Owner',
          tag: 'core',
          children: [
            {
              name: 'Hazem Dw.',
              role: 'Sales Manager',
              tag: 'core',
              children: [
                { name: 'Bisho', role: 'Sales onboarded by Hazem', tag: 'external' },
                { name: 'Tomoki', role: 'Sales onboarded by Hazem', tag: 'external' },
                { name: 'Hamzah', role: 'Sales onboarded by Hazem', tag: 'external' },
                { name: 'Aziz', role: 'Sales onboarded by Hazem', tag: 'external' },
              ],
            },
            {
              name: 'Thomas / T Charrier',
              role: 'Sales Manager',
              tag: 'core',
              children: [
                { name: 'Nathan', role: 'Core sales member onboarded under Thomas', tag: 'core' },
              ],
            },
            {
              name: 'Zuri Robledo',
              role: 'Sales Manager',
              tag: 'core',
              children: [{ name: 'Leo Ioannidis', role: 'Sales / team candidate', tag: 'candidate' }],
            },
            { name: 'Lachie', role: 'Sales Manager', tag: 'core' },
            { name: 'Lewis Hayward', role: 'Sales Manager', tag: 'core' },
            {
              name: 'Allan Chan',
              role: 'External field sales onboarding',
              tag: 'core',
              children: [
                { name: 'Cory McGuckin', role: 'Sales Person / Field Sales Agent', tag: 'external' },
                { name: 'Gerrard McFerran', role: 'Sales Person / Field Sales Agent', tag: 'external' },
                { name: 'ETKC', role: 'Sales Person / Field Sales Agent', tag: 'external' },
                { name: 'Yonalle', role: 'Sales Person / Field Sales Agent', tag: 'external' },
                { name: 'Nicky', role: 'Sales Person / Field Sales Agent', tag: 'external' },
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
          role: 'Marketing Owner, final public-facing approval',
          tag: 'core',
          children: [
            {
              name: 'Bailey',
              role: 'Rosey Co Squad Leader / marketing implementation',
              tag: 'core',
              children: [
                { name: "Barry's Brother", role: 'Rosey Co Reservist', tag: 'reservist' },
                { name: 'Valdas', role: 'Rosey Co Reservist', tag: 'reservist' },
                { name: 'Kelvin', role: 'Rosey Co Reservist', tag: 'reservist' },
                { name: 'James', role: 'Rosey Co Reservist', tag: 'reservist' },
              ],
            },
            { name: 'Emil Larsen', role: 'Video editing and creative fulfillment', tag: 'core' },
            { name: 'Julian', role: 'Social media support where needed', tag: 'core' },
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
          role: 'Technology Owner / Chief Technology Officer',
          tag: 'core',
          children: [
            { name: 'Bailey', role: 'Artificial intelligence and technical fulfillment lead', tag: 'core' },
            { name: 'Jeison', role: 'Product / technical fulfillment', tag: 'core' },
            { name: 'Tanzeel Ahmad', role: 'Product / technical fulfillment', tag: 'core' },
            { name: 'Chase Buchanan', role: 'Product / technical fulfillment', tag: 'core' },
            { name: 'Callum', role: 'Product / technical fulfillment', tag: 'core' },
            { name: 'Emil Larsen', role: 'Backend and coding support', tag: 'core' },
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
              role: 'Key e-commerce operator / social-store execution',
              tag: 'core',
              children: [
                { name: 'Ross', role: 'Affiliate', tag: 'external' },
                { name: 'Matt', role: 'Affiliate', tag: 'external' },
                { name: 'Mantas', role: 'Affiliate', tag: 'external' },
                { name: 'Bisho', role: 'Affiliate', tag: 'external' },
                { name: 'Tomoki', role: 'Affiliate', tag: 'external' },
              ],
            },
            { name: 'Bailey', role: 'Store setup and technical/marketing implementation', tag: 'core' },
            { name: 'Emil Larsen', role: 'Store videos, content, backend support', tag: 'core' },
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
          role: 'People Manager, role clarity, morale, private check-ins, conflict handling',
          tag: 'core',
        },
      ],
    },
    {
      name: '__SECTION__',
      role: 'Partner / Other',
      tag: 'core',
      children: [{ name: 'Ratan and his team', role: 'Fulfillment candidate', tag: 'candidate' }],
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
