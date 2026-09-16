import BuildBoxPageClient from './BuildBoxPageClient';
import { PAGE_METADATA } from '../../../lib/metadata';

export const metadata = PAGE_METADATA.buildBox;

export default function BuildBox() {
  return <BuildBoxPageClient />;
}
