import type { Company } from './types';

// Private unicorn startups. Valuations are approximate peak private valuations, in billions of USD.
export const COMPANIES: Company[] = [
  { id: 'stripe', name: 'Stripe', domain: 'stripe.com', sector: 'Fintech', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2010, status: 'private', peakValuationB: 95, brandColor: '#635BFF' },
  { id: 'spacex', name: 'SpaceX', domain: 'spacex.com', sector: 'Aerospace', hqCountry: 'USA', hqCity: 'Hawthorne', founded: 2002, status: 'private', peakValuationB: 350, brandColor: '#000000' },
  { id: 'openai', name: 'OpenAI', domain: 'openai.com', sector: 'AI', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2015, status: 'private', peakValuationB: 300, brandColor: '#10A37F' },
  { id: 'anthropic', name: 'Anthropic', domain: 'anthropic.com', sector: 'AI', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2021, status: 'private', peakValuationB: 180, brandColor: '#D97757' },
  { id: 'databricks', name: 'Databricks', domain: 'databricks.com', sector: 'Data & Cloud', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2013, status: 'private', peakValuationB: 100, brandColor: '#FF3621' },
  { id: 'revolut', name: 'Revolut', domain: 'revolut.com', sector: 'Fintech', hqCountry: 'UK', hqCity: 'London', founded: 2015, status: 'private', peakValuationB: 45, brandColor: '#191C1F' },
  { id: 'rippling', name: 'Rippling', domain: 'rippling.com', sector: 'HR & Payroll', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2016, status: 'private', peakValuationB: 16, brandColor: '#FDB71A' },
  { id: 'ramp', name: 'Ramp', domain: 'ramp.com', sector: 'Fintech', hqCountry: 'USA', hqCity: 'New York', founded: 2019, status: 'private', peakValuationB: 22, brandColor: '#E4F222' },
  { id: 'plaid', name: 'Plaid', domain: 'plaid.com', sector: 'Fintech', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2013, status: 'private', peakValuationB: 13, brandColor: '#111111' },
  { id: 'perplexity', name: 'Perplexity', domain: 'perplexity.ai', sector: 'AI', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2022, status: 'private', peakValuationB: 20, brandColor: '#20808D' },
  { id: 'mistral', name: 'Mistral AI', domain: 'mistral.ai', sector: 'AI', hqCountry: 'France', hqCity: 'Paris', founded: 2023, status: 'private', peakValuationB: 14, brandColor: '#FF7000' },
  { id: 'xai', name: 'xAI', domain: 'x.ai', sector: 'AI', hqCountry: 'USA', hqCity: 'Palo Alto', founded: 2023, status: 'private', peakValuationB: 200, brandColor: '#000000' },
  { id: 'notion', name: 'Notion', domain: 'notion.so', sector: 'Productivity', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2013, status: 'private', peakValuationB: 10, brandColor: '#000000' },
  { id: 'vercel', name: 'Vercel', domain: 'vercel.com', sector: 'Dev Tools', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2015, status: 'private', peakValuationB: 9.3, brandColor: '#000000' },
  { id: 'gusto', name: 'Gusto', domain: 'gusto.com', sector: 'HR & Payroll', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2011, status: 'private', peakValuationB: 9.5, brandColor: '#F45D48' },
  { id: 'cursor', name: 'Cursor', domain: 'cursor.com', sector: 'Dev Tools', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2022, status: 'private', peakValuationB: 29, brandColor: '#000000' },


  { id: 'anduril', name: 'Anduril', domain: 'anduril.com', sector: 'Defense', hqCountry: 'USA', hqCity: 'Costa Mesa', founded: 2017, status: 'private', peakValuationB: 30.5, brandColor: '#000000' },
  { id: 'supabase', name: 'Supabase', domain: 'supabase.com', sector: 'Dev Tools', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2020, status: 'private', peakValuationB: 5, brandColor: '#3ECF8E' },
  { id: 'linear', name: 'Linear', domain: 'linear.app', sector: 'Productivity', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2019, status: 'private', peakValuationB: 1.25, brandColor: '#5E6AD2' },
  { id: 'lovable', name: 'Lovable', domain: 'lovable.dev', sector: 'AI', hqCountry: 'Sweden', hqCity: 'Stockholm', founded: 2023, status: 'private', peakValuationB: 1.8, brandColor: '#FF6B6B' },
  { id: 'elevenlabs', name: 'ElevenLabs', domain: 'elevenlabs.io', sector: 'AI', hqCountry: 'USA', hqCity: 'New York', founded: 2022, status: 'private', peakValuationB: 6.6, brandColor: '#000000' },
  { id: 'runway', name: 'Runway', domain: 'runwayml.com', sector: 'AI', hqCountry: 'USA', hqCity: 'New York', founded: 2018, status: 'private', peakValuationB: 3, brandColor: '#000000' },
  { id: 'cerebras', name: 'Cerebras', domain: 'cerebras.ai', sector: 'AI', hqCountry: 'USA', hqCity: 'Sunnyvale', founded: 2015, status: 'private', peakValuationB: 8.1, brandColor: '#F15A29' },
  { id: 'sierra', name: 'Sierra', domain: 'sierra.ai', sector: 'AI', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2023, status: 'private', peakValuationB: 10, brandColor: '#1B1B1B' },
  { id: 'harvey', name: 'Harvey', domain: 'harvey.ai', sector: 'AI', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2022, status: 'private', peakValuationB: 5, brandColor: '#000000' },
  { id: 'glean', name: 'Glean', domain: 'glean.com', sector: 'AI', hqCountry: 'USA', hqCity: 'Palo Alto', founded: 2019, status: 'private', peakValuationB: 7.2, brandColor: '#343CED' },
  { id: 'cohere', name: 'Cohere', domain: 'cohere.com', sector: 'AI', hqCountry: 'Canada', hqCity: 'Toronto', founded: 2019, status: 'private', peakValuationB: 6.8, brandColor: '#39594D' },
  { id: 'ssi', name: 'SSI', domain: 'ssi.inc', sector: 'AI', hqCountry: 'USA', hqCity: 'Palo Alto', founded: 2024, status: 'private', peakValuationB: 32, brandColor: '#000000' },
  { id: 'thinkingmachines', name: 'Thinking Machines', domain: 'thinkingmachines.ai', sector: 'AI', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2025, status: 'private', peakValuationB: 12, brandColor: '#000000' },
  { id: 'oura', name: 'Oura', domain: 'ouraring.com', sector: 'Hardware', hqCountry: 'Finland', hqCity: 'Oulu', founded: 2013, status: 'private', peakValuationB: 11, brandColor: '#000000' },
  { id: 'kraken', name: 'Kraken', domain: 'kraken.com', sector: 'Crypto', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2011, status: 'private', peakValuationB: 15, brandColor: '#5741D9' },
  { id: 'mercury', name: 'Mercury', domain: 'mercury.com', sector: 'Fintech', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2017, status: 'private', peakValuationB: 3.5, brandColor: '#5266EB' },
  { id: 'carta', name: 'Carta', domain: 'carta.com', sector: 'Fintech', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2012, status: 'private', peakValuationB: 7.4, brandColor: '#000000' },
  { id: 'whatnot', name: 'Whatnot', domain: 'whatnot.com', sector: 'E-commerce', hqCountry: 'USA', hqCity: 'Los Angeles', founded: 2019, status: 'private', peakValuationB: 11.5, brandColor: '#FFDF00' },
  { id: 'nuro', name: 'Nuro', domain: 'nuro.ai', sector: 'Robotics', hqCountry: 'USA', hqCity: 'Mountain View', founded: 2016, status: 'private', peakValuationB: 8.6, brandColor: '#000000' },
  { id: 'neuralink', name: 'Neuralink', domain: 'neuralink.com', sector: 'Healthtech', hqCountry: 'USA', hqCity: 'Austin', founded: 2016, status: 'private', peakValuationB: 9, brandColor: '#000000' },
  { id: 'appliedcompute', name: 'Applied Compute', domain: 'appliedcompute.com', sector: 'AI', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2025, status: 'private', peakValuationB: 0.5, brandColor: '#000000' },
  { id: 'appliedintuition', name: 'Applied Intuition', domain: 'appliedintuition.com', sector: 'Autonomy', hqCountry: 'USA', hqCity: 'Mountain View', founded: 2017, status: 'private', peakValuationB: 15, brandColor: '#000000' },
  { id: 'gamma', name: 'Gamma', domain: 'gamma.app', sector: 'Productivity', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2020, status: 'private', peakValuationB: 2.1, brandColor: '#8B5CF6' },
  { id: 'baseten', name: 'Baseten', domain: 'baseten.co', sector: 'AI Infra', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2019, status: 'private', peakValuationB: 2.15, brandColor: '#000000' },
  { id: 'modal', name: 'Modal', domain: 'modal.com', sector: 'AI Infra', hqCountry: 'USA', hqCity: 'New York', founded: 2021, status: 'private', peakValuationB: 1.1, brandColor: '#7FEE64' },
  { id: 'longlake', name: 'Long Lake', domain: 'llmh.com', sector: 'Services', hqCountry: 'USA', hqCity: 'New York', founded: 2024, status: 'private', peakValuationB: 2, brandColor: '#5D6D7A', logoUrl: '/logos/longlake.png' },
  { id: 'cognition', name: 'Cognition', domain: 'cognition.ai', sector: 'AI', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2023, status: 'private', peakValuationB: 10.2, brandColor: '#000000' },
  { id: 'clay', name: 'Clay', domain: 'clay.com', sector: 'Sales', hqCountry: 'USA', hqCity: 'New York', founded: 2017, status: 'private', peakValuationB: 3.1, brandColor: '#000000' },
  { id: 'decagon', name: 'Decagon', domain: 'decagon.ai', sector: 'AI', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2023, status: 'private', peakValuationB: 1.5, brandColor: '#000000' },
  { id: 'legora', name: 'Legora', domain: 'legora.com', sector: 'Legal AI', hqCountry: 'Sweden', hqCity: 'Stockholm', founded: 2023, status: 'private', peakValuationB: 1.8, brandColor: '#000000' },
  { id: 'mercor', name: 'Mercor', domain: 'mercor.com', sector: 'AI', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2023, status: 'private', peakValuationB: 10, brandColor: '#000000' },
  { id: 'togetherai', name: 'Together AI', domain: 'together.ai', sector: 'AI Infra', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2022, status: 'private', peakValuationB: 3.3, brandColor: '#0F6FFF' },
  { id: 'worldlabs', name: 'World Labs', domain: 'worldlabs.ai', sector: 'AI', hqCountry: 'USA', hqCity: 'San Francisco', founded: 2024, status: 'private', peakValuationB: 5, brandColor: '#000000' },
];

/** Every company in the game. Each board deals BOARD_SIZE of these at random. */
export const DECK: Company[] = COMPANIES;

export const COMPANY_BY_ID: Record<string, Company> = Object.fromEntries(
  COMPANIES.map((c) => [c.id, c]),
);
