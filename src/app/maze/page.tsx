import { AppDetail } from "@/components/app-detail";
import { meta } from "./app.meta";
import Overview from "./overview.mdx";
import Tutorial from "./tutorial.mdx";

export const metadata = {
  title: `${meta.title} — creative-coding-library`,
  description: meta.description,
};

export default function MazeDetailPage() {
  return <AppDetail meta={meta} synopsis={<Overview />} tutorial={<Tutorial />} />;
}
