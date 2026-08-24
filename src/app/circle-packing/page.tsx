import { AppDetail } from "@/components/app-detail";
import { PredictPrompt } from "@/components/learning/PredictPrompt";
import { RecallCheck } from "@/components/learning/RecallCheck";
import { meta } from "./app.meta";
import Overview from "./overview.mdx";
import Tutorial from "./tutorial.mdx";

export const metadata = {
  title: `${meta.title} — creative-coding-library`,
  description: meta.description,
};

export default function CirclePackingDetailPage() {
  return (
    <div className="flex flex-col gap-4">
      {meta.predictPrompt && (
        <div className="px-4 pt-4 sm:px-6">
          <PredictPrompt prompt={meta.predictPrompt} />
        </div>
      )}
      <AppDetail meta={meta} synopsis={<Overview />} tutorial={<Tutorial />} />
      {meta.recallChecks && meta.recallChecks.length > 0 && (
        <div className="px-4 pb-4 sm:px-6">
          <RecallCheck checks={meta.recallChecks} />
        </div>
      )}
    </div>
  );
}
