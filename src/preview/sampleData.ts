import type { ProductCardData } from '@/components/product/ProductCard'

export const sampleProducts: ProductCardData[] = [
  {
    slug: 'sample-one',
    name: 'Sample product one',
    descriptor: 'Sample descriptor',
    pricePaise: 29900,
    accent: 'lime',
    label: 'New',
  },
  {
    slug: 'sample-two',
    name: 'Sample product two',
    descriptor: 'Sample descriptor',
    pricePaise: 34900,
    accent: 'lavender',
    availability: 'low_stock',
  },
  {
    slug: 'sample-three',
    name: 'Sample product three',
    descriptor: 'Sample descriptor',
    pricePaise: 24900,
    accent: 'orange',
    label: 'Featured',
  },
  {
    slug: 'sample-four',
    name: 'Sample product four',
    descriptor: 'Sample descriptor',
    pricePaise: 39900,
    accent: 'lavender',
    availability: 'out_of_stock',
  },
]
